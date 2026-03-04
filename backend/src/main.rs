use axum::{
    extract::{Path, State},
    response::Json,
    routing::{get, post, put},
    Router,
};
use clap::Parser;
use serde::Deserialize;
use std::{
    net::SocketAddr,
    path::{Path as FsPath, PathBuf},
    sync::{Arc, RwLock},
};
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tracing::{info, warn};

mod config;
mod error;

use config::ADJConfig;
use error::{AppError, Result};

/// ADJ Valet Backend - Rust rewrite for better reliability
#[derive(Parser)]
#[command(name = "adj-valet-backend")]
#[command(about = "A reliable backend for ADJ Valet configuration management")]
struct Cli {
    /// Port to listen on
    #[arg(short, long, default_value = "8000")]
    port: u16,
    
    /// Host to bind to  
    #[arg(long, default_value = "0.0.0.0")]
    host: String,
    
    /// ADJ directory path (optional, can be set via API)
    #[arg(short, long)]
    adj_path: Option<PathBuf>,

    /// Directory containing the bundled frontend assets
    #[arg(long, default_value = "web")]
    web_dir: PathBuf,

    /// File used to publish the backend port for desktop wrappers
    #[arg(long, default_value = ".adj-valet-port")]
    port_file: PathBuf,
}

/// Application state
#[derive(Clone)]
struct AppState {
    config: Arc<RwLock<Option<ADJConfig>>>,
    adj_path: Arc<RwLock<Option<PathBuf>>>,
}

impl AppState {
    fn new(adj_path: Option<PathBuf>) -> Self {
        Self {
            config: Arc::new(RwLock::new(None)),
            adj_path: Arc::new(RwLock::new(adj_path)),
        }
    }
}

/// Request to set ADJ directory path
#[derive(Deserialize)]
struct SetPathRequest {
    path: String,
}

/// Request to rename a board
#[derive(Deserialize)]
struct RenameBoardRequest {
    new_name: String,
}

/// Health check endpoint
async fn health() -> &'static str {
    "OK"
}

/// Set the ADJ directory path and load configuration
async fn set_adj_path(
    State(state): State<AppState>,
    Json(request): Json<SetPathRequest>,
) -> Result<Json<String>> {
    let path = PathBuf::from(&request.path);
    
    if !path.exists() {
        return Err(AppError::NotFound(format!("Directory not found: {}", request.path)));
    }

    // Load configuration from the new path
    let config = ADJConfig::load_from_directory(&path)?;
    
    // Update state
    {
        let mut adj_path = state.adj_path.write().unwrap();
        *adj_path = Some(path);
    }
    {
        let mut stored_config = state.config.write().unwrap();
        *stored_config = Some(config);
    }

    info!("ADJ path set to: {}", request.path);
    Ok(Json("Path set successfully".to_string()))
}

/// Get the current ADJ configuration
async fn get_config(State(state): State<AppState>) -> Result<Json<ADJConfig>> {
    let config = state.config.read().unwrap();
    match config.as_ref() {
        Some(config) => Ok(Json(config.clone())),
        None => Err(AppError::BadRequest("No ADJ path set".to_string())),
    }
}

/// Assemble and return the current ADJ configuration (alias for get_config)
async fn assemble_config(state: State<AppState>) -> Result<Json<ADJConfig>> {
    get_config(state).await
}

/// Update the entire ADJ configuration
async fn update_config(
    State(state): State<AppState>,
    Json(new_config): Json<ADJConfig>,
) -> Result<Json<ADJConfig>> {
    let adj_path = {
        let path_guard = state.adj_path.read().unwrap();
        path_guard.as_ref().ok_or_else(|| {
            AppError::BadRequest("No ADJ path set".to_string())
        })?.clone()
    };

    // Basic validation to prevent data corruption
    if new_config.general_info.ports.is_empty() && new_config.boards.is_empty() {
        warn!("Rejecting config update with empty ports and boards - likely incomplete data");
        return Err(AppError::BadRequest("Invalid configuration: empty ports and boards".to_string()));
    }

    info!("Updating configuration with {} boards and {} ports", 
          new_config.boards.len(), new_config.general_info.ports.len());

    // Save to filesystem
    new_config.save_to_directory(&adj_path)?;

    // Update in-memory state
    {
        let mut config = state.config.write().unwrap();
        *config = Some(new_config.clone());
    }

    info!("Configuration updated successfully");
    Ok(Json(new_config))
}

/// Rename a board atomically
async fn rename_board(
    State(state): State<AppState>,
    Path(old_name): Path<String>,
    Json(request): Json<RenameBoardRequest>,
) -> Result<Json<ADJConfig>> {
    let adj_path = {
        let path_guard = state.adj_path.read().unwrap();
        path_guard.as_ref().ok_or_else(|| {
            AppError::BadRequest("No ADJ path set".to_string())
        })?.clone()
    };

    let mut config = {
        let config_guard = state.config.read().unwrap();
        config_guard.as_ref().ok_or_else(|| {
            AppError::BadRequest("No configuration loaded".to_string())
        })?.clone()
    };

    // Perform the rename operation
    config.rename_board(&old_name, &request.new_name, &adj_path)?;

    // Save to filesystem
    config.save_to_directory(&adj_path)?;

    // Update in-memory state
    {
        let mut stored_config = state.config.write().unwrap();
        *stored_config = Some(config.clone());
    }

    info!("Board renamed from '{}' to '{}'", old_name, request.new_name);
    Ok(Json(config))
}

/// Find an available port starting from the preferred port
async fn find_available_port(host: &str, preferred_port: u16) -> anyhow::Result<u16> {
    const MAX_PORT_ATTEMPTS: u16 = 100;
    
    for port in preferred_port..=(preferred_port + MAX_PORT_ATTEMPTS) {
        let addr = format!("{}:{}", host, port);
        match tokio::net::TcpListener::bind(&addr).await {
            Ok(_) => {
                info!("Found available port: {}", port);
                return Ok(port);
            }
            Err(_) => {
                // Port is in use, try next one
                continue;
            }
        }
    }
    
    // If we can't find a port in the range, return an error
    Err(anyhow::anyhow!(
        "Could not find available port in range {}-{}", 
        preferred_port, 
        preferred_port + MAX_PORT_ATTEMPTS
    ))
}

/// Write port information to a file for frontend coordination
async fn write_port_info(port: u16, port_file: &FsPath) -> anyhow::Result<()> {
    use std::fs;
    
    let port_info = serde_json::json!({
        "backend_port": port,
        "backend_url": format!("http://localhost:{}", port),
        "timestamp": chrono::Utc::now().to_rfc3339()
    });
    
    if let Some(parent) = port_file.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)?;
        }
    }

    fs::write(port_file, serde_json::to_string_pretty(&port_info)?)?;
    info!("Port information written to {}", port_file.display());
    
    // Also write to the frontend public directory for local dev.
    if let Ok(frontend_path) = std::env::current_dir() {
        let frontend_public = frontend_path.join("../frontend/public/.adj-valet-port");
        if let Some(parent) = frontend_public.parent() {
            if parent.exists() {
                if let Err(e) = fs::write(&frontend_public, serde_json::to_string_pretty(&port_info)?) {
                    info!("Could not write to frontend public directory: {}", e);
                } else {
                    info!("Port information written to frontend public directory");
                }
            }
        }
    }
    
    Ok(())
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Parse command line arguments
    let cli = Cli::parse();

    // Create application state
    let state = AppState::new(cli.adj_path.clone());
    
    // If ADJ path provided via CLI, load config immediately
    if let Some(adj_path) = cli.adj_path {
        match ADJConfig::load_from_directory(&adj_path) {
            Ok(config) => {
                {
                    let mut stored_config = state.config.write().unwrap();
                    *stored_config = Some(config);
                }
                info!("Loaded configuration from: {}", adj_path.display());
            }
            Err(e) => {
                warn!("Failed to load configuration from {}: {}", adj_path.display(), e);
            }
        }
    }

    // Build the router
    let app = Router::new()
        .route("/health", get(health))
        .route("/path", post(set_adj_path))
        .route("/assemble", get(assemble_config))
        .route("/update", post(update_config))
        .route("/config", get(get_config))
        .route("/config", put(update_config))
        .route("/boards/:name/rename", post(rename_board))
        .nest_service(
            "/",
            ServeDir::new(cli.web_dir.clone())
                .fallback(ServeDir::new(cli.web_dir.clone()).append_index_html_on_directories(true)),
        )
        .layer(CorsLayer::permissive())
        .with_state(state);

    // Find an available port starting from the requested port
    let actual_port = find_available_port(&cli.host, cli.port).await?;
    let addr = SocketAddr::from(([0, 0, 0, 0], actual_port));
    
    info!("Starting ADJ Valet Backend on {}", addr);
    if actual_port != cli.port {
        info!("Note: Requested port {} was unavailable, using port {}", cli.port, actual_port);
    }
    info!("Endpoints:");
    info!("  GET  /health - Health check");
    info!("  POST /path - Set ADJ directory path");
    info!("  GET  /assemble - Get current configuration (frontend compatible)");
    info!("  POST /update - Update configuration (frontend compatible)");
    info!("  GET  /config - Get current configuration");
    info!("  PUT  /config - Update configuration");
    info!("  POST /boards/:name/rename - Rename a board");

    // Write port information to a file for frontend coordination
    write_port_info(actual_port, &cli.port_file).await?;

    // Start the server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
