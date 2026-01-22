use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::Path};
use tracing::{info, warn};

/// Top-level ADJ configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ADJConfig {
    pub general_info: GeneralInfo,
    pub boards: Vec<BoardEntry>,
    pub board_list: HashMap<String, String>, // board_name -> path mapping
}

/// A board entry - keeps the original nested structure for frontend compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoardEntry {
    #[serde(flatten)]
    pub board: HashMap<String, Board>, // Single key-value pair: board_name -> Board
}

impl BoardEntry {
    pub fn new(name: String, board: Board) -> Self {
        let mut map = HashMap::new();
        map.insert(name, board);
        Self { board: map }
    }

    pub fn name(&self) -> &String {
        self.board.keys().next().unwrap()
    }

    pub fn board(&self) -> &Board {
        self.board.values().next().unwrap()
    }

    pub fn board_mut(&mut self) -> &mut Board {
        self.board.values_mut().next().unwrap()
    }
}

/// General configuration information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralInfo {
    pub ports: HashMap<String, u16>,
    pub addresses: HashMap<String, String>,
    pub units: HashMap<String, String>,
    pub message_ids: HashMap<String, u32>,
}

/// Board configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Board {
    pub board_id: u32,
    pub board_ip: String,
    pub measurements: Vec<Measurement>,
    pub packets: Vec<Packet>,
    #[serde(default)]
    pub sockets: Vec<Socket>,
}

/// Socket definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Socket {
    #[serde(rename = "type")]
    pub socket_type: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub local_port: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remote_ip: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remote_port: Option<u16>,
}

/// Measurement definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Measurement {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub measurement_type: String,
    #[serde(rename = "podUnits", skip_serializing_if = "Option::is_none")]
    pub pod_units: Option<String>,
    #[serde(rename = "displayUnits", skip_serializing_if = "Option::is_none")]
    pub display_units: Option<String>,
    #[serde(rename = "enumValues", skip_serializing_if = "Option::is_none")]
    pub enum_values: Option<Vec<String>>,
    #[serde(rename = "safeRange", skip_serializing_if = "Option::is_none")]
    pub safe_range: Option<[f64; 2]>,
    #[serde(rename = "warningRange", skip_serializing_if = "Option::is_none")]
    pub warning_range: Option<[f64; 2]>,
}

/// Packet definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Packet {
    #[serde(rename = "type")]
    pub packet_type: String,
    pub name: String,
    #[serde(default)]
    pub variables: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub period_ms: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub socket: Option<String>,
}

impl ADJConfig {
    /// Load configuration from an ADJ directory
    pub fn load_from_directory(adj_path: &Path) -> Result<Self> {
        info!("Loading ADJ configuration from: {}", adj_path.display());
        info!("ADJ directory exists: {}", adj_path.exists());

        // Load general_info.json
        let general_info = Self::load_general_info(adj_path)?;

        // Load board_list from boards.json
        let board_list = Self::load_board_list(adj_path)?;

        // Load all boards using the board_list paths
        let boards = Self::load_boards(adj_path)?;

        Ok(ADJConfig {
            general_info,
            boards,
            board_list,
        })
    }

    /// Save configuration to an ADJ directory
    pub fn save_to_directory(&self, adj_path: &Path) -> Result<()> {
        info!("Saving ADJ configuration to: {}", adj_path.display());

        // Save general_info.json
        self.save_general_info(adj_path)?;

        // Save boards.json
        self.save_board_list(adj_path)?;

        // Save all boards to the boards/ directory
        self.save_boards(adj_path)?;

        Ok(())
    }

    /// Rename a board atomically
    pub fn rename_board(&mut self, old_name: &str, new_name: &str, adj_path: &Path) -> Result<()> {
        // Check if new name already exists
        if self.boards.iter().any(|entry| entry.name() == new_name) {
            return Err(AppError::Conflict(format!(
                "Board with name '{}' already exists",
                new_name
            )));
        }

        // Find the board to rename
        let board_index = self
            .boards
            .iter()
            .position(|entry| entry.name() == old_name)
            .ok_or_else(|| AppError::NotFound(format!("Board '{}' not found", old_name)))?;

        let board_entry = &mut self.boards[board_index];
        let board = board_entry.board().clone();

        // Update board_list mapping (remove old entry, add new one)
        self.board_list.remove(old_name);
        let new_path = format!("boards/{}/{}.json", new_name, new_name);
        self.board_list.insert(new_name.to_string(), new_path);

        // Rename directory on filesystem if it exists
        let boards_dir = adj_path.join("boards");
        let old_dir = boards_dir.join(old_name);
        let new_dir = boards_dir.join(new_name);

        if old_dir.exists() {
            info!("Renaming board directory: {} -> {}", old_name, new_name);
            fs::rename(&old_dir, &new_dir)?;

            // Rename the main board JSON file
            let old_json = new_dir.join(format!("{}.json", old_name));
            let new_json = new_dir.join(format!("{}.json", new_name));
            if old_json.exists() {
                fs::rename(&old_json, &new_json)?;
            }

            // Rename measurements file if it exists
            let old_measurements = new_dir.join(format!("{}_measurements.json", old_name));
            let new_measurements = new_dir.join(format!("{}_measurements.json", new_name));
            if old_measurements.exists() {
                fs::rename(&old_measurements, &new_measurements)?;
            }
        }

        // Update the board entry in memory
        self.boards[board_index] = BoardEntry::new(new_name.to_string(), board);

        Ok(())
    }

    fn load_general_info(adj_path: &Path) -> Result<GeneralInfo> {
        let path = adj_path.join("general_info.json");
        let content = fs::read_to_string(path)?;
        Ok(serde_json::from_str(&content)?)
    }

    fn load_board_list(adj_path: &Path) -> Result<HashMap<String, String>> {
        let boards_json_path = adj_path.join("boards.json");
        if !boards_json_path.exists() {
            warn!("boards.json not found, creating empty board list");
            return Ok(HashMap::new());
        }

        let content = fs::read_to_string(boards_json_path)?;
        Ok(serde_json::from_str(&content)?)
    }

    fn load_boards(adj_path: &Path) -> Result<Vec<BoardEntry>> {
        // First, read boards.json to get the list of boards and their paths
        let boards_json_path = adj_path.join("boards.json");
        if !boards_json_path.exists() {
            warn!(
                "boards.json not found at: {}, scanning boards directory",
                boards_json_path.display()
            );
            return Self::load_boards_from_directory(adj_path);
        }

        info!("Reading boards.json from: {}", boards_json_path.display());
        let boards_content = fs::read_to_string(&boards_json_path)?;
        let board_list: HashMap<String, String> = serde_json::from_str(&boards_content)?;

        info!(
            "Found {} boards in boards.json: {:?}",
            board_list.len(),
            board_list.keys().collect::<Vec<_>>()
        );

        let mut boards = Vec::new();

        for (board_name, board_path) in board_list {
            let full_board_path = adj_path.join(&board_path);

            info!(
                "Loading board '{}' from: {}",
                board_name,
                full_board_path.display()
            );

            if !full_board_path.exists() {
                warn!("Board file not found: {}", full_board_path.display());
                continue;
            }

            // Get the directory containing the board file
            let board_dir = full_board_path.parent().unwrap();

            // Try to load the board
            match Self::load_single_board_from_path(&board_name, &full_board_path, board_dir) {
                Ok(board) => {
                    info!(
                        "Successfully loaded board '{}' with {} measurements and {} packets",
                        board_name,
                        board.measurements.len(),
                        board.packets.len()
                    );
                    boards.push(BoardEntry::new(board_name, board));
                }
                Err(e) => {
                    warn!("Failed to load board '{}': {}", board_name, e);
                    continue;
                }
            }
        }

        info!("Total boards loaded: {}", boards.len());
        Ok(boards)
    }

    // Fallback method for loading boards by scanning directories
    fn load_boards_from_directory(adj_path: &Path) -> Result<Vec<BoardEntry>> {
        let boards_dir = adj_path.join("boards");
        if !boards_dir.exists() {
            warn!("boards directory not found, creating empty boards list");
            return Ok(Vec::new());
        }

        let mut boards = Vec::new();

        for entry in fs::read_dir(boards_dir)? {
            let entry = entry?;
            let board_name = entry.file_name().to_string_lossy().to_string();
            let board_dir = entry.path();

            if !board_dir.is_dir() {
                continue;
            }

            // Try to load the board using the old method
            match Self::load_single_board(&board_name, &board_dir) {
                Ok(board) => {
                    boards.push(BoardEntry::new(board_name, board));
                }
                Err(e) => {
                    warn!("Failed to load board '{}': {}", board_name, e);
                    continue;
                }
            }
        }

        Ok(boards)
    }

    fn load_single_board_from_path(
        _board_name: &str,
        board_file_path: &Path,
        board_dir: &Path,
    ) -> Result<Board> {
        // Load main board JSON from the specific file path
        let content = fs::read_to_string(board_file_path)?;
        let board_info: serde_json::Value = serde_json::from_str(&content)?;

        // Extract basic board info
        let board_id = board_info["board_id"].as_u64().unwrap_or(0) as u32;
        let board_ip = board_info["board_ip"]
            .as_str()
            .unwrap_or("0.0.0.0")
            .to_string();

        // Load measurements from paths specified in board JSON
        let empty_array = vec![];
        let measurement_files = board_info["measurements"]
            .as_array()
            .unwrap_or(&empty_array);
        let measurements = Self::load_measurements_from_files(measurement_files, board_dir)?;

        // Load packets from paths specified in board JSON
        let empty_array_packets = vec![];
        let packet_files = board_info["packets"]
            .as_array()
            .unwrap_or(&empty_array_packets);
        let packets = Self::load_packets_from_files(packet_files, board_dir)?;

        let empty_array_sockets = vec![];
        let socket_files = board_info["sockets"]
            .as_array()
            .unwrap_or(&empty_array_sockets);
        let sockets = Self::load_sockets_from_files(socket_files, board_dir)?;

        Ok(Board {
            board_id,
            board_ip,
            measurements,
            packets,
            sockets,
        })
    }

    fn load_single_board(board_name: &str, board_dir: &Path) -> Result<Board> {
        // Load main board JSON
        let main_json_path = board_dir.join(format!("{}.json", board_name));
        let board_info: serde_json::Value = if main_json_path.exists() {
            let content = fs::read_to_string(main_json_path)?;
            serde_json::from_str(&content)?
        } else {
            warn!(
                "Main board JSON not found for '{}', using defaults",
                board_name
            );
            serde_json::json!({
                "board_id": 0,
                "board_ip": "0.0.0.0",
                "measurements": [],
                "packets": [],
                "sockets": []
            })
        };

        let board_id = board_info["board_id"].as_u64().unwrap_or(0) as u32;
        let board_ip = board_info["board_ip"]
            .as_str()
            .unwrap_or("0.0.0.0")
            .to_string();

        let empty_array = vec![];
        let measurement_files = board_info["measurements"]
            .as_array()
            .unwrap_or(&empty_array);
        let measurements = Self::load_measurements_from_files(measurement_files, board_dir)?;

        let empty_array_packets = vec![];
        let packet_files = board_info["packets"]
            .as_array()
            .unwrap_or(&empty_array_packets);
        let packets = Self::load_packets_from_files(packet_files, board_dir)?;

        let empty_array_sockets = vec![];
        let socket_files = board_info["sockets"]
            .as_array()
            .unwrap_or(&empty_array_sockets);
        let sockets = Self::load_sockets_from_files(socket_files, board_dir)?;

        Ok(Board {
            board_id,
            board_ip,
            measurements,
            packets,
            sockets,
        })
    }

    fn load_measurements_from_files(
        measurement_files: &[serde_json::Value],
        board_dir: &Path,
    ) -> Result<Vec<Measurement>> {
        let mut all_measurements = Vec::new();

        for file_value in measurement_files {
            if let Some(file_name) = file_value.as_str() {
                let measurements_path = board_dir.join(file_name);
                info!("Loading measurements from: {}", measurements_path.display());

                if measurements_path.exists() {
                    match fs::read_to_string(&measurements_path) {
                        Ok(content) => {
                            if content.trim().is_empty() {
                                warn!("Empty measurements file: {}", measurements_path.display());
                                continue;
                            }

                            match serde_json::from_str::<Vec<Measurement>>(&content) {
                                Ok(measurements) => {
                                    info!(
                                        "Loaded {} measurements from {}",
                                        measurements.len(),
                                        file_name
                                    );
                                    all_measurements.extend(measurements);
                                }
                                Err(e) => {
                                    warn!(
                                        "Failed to parse measurements from {}: {}",
                                        measurements_path.display(),
                                        e
                                    );
                                    continue;
                                }
                            }
                        }
                        Err(e) => {
                            warn!(
                                "Failed to read measurements file {}: {}",
                                measurements_path.display(),
                                e
                            );
                            continue;
                        }
                    }
                } else {
                    warn!(
                        "Measurements file not found: {}",
                        measurements_path.display()
                    );
                }
            }
        }

        Ok(all_measurements)
    }

    fn load_packets_from_files(
        packet_files: &[serde_json::Value],
        board_dir: &Path,
    ) -> Result<Vec<Packet>> {
        let mut all_packets = Vec::new();

        for file_value in packet_files {
            if let Some(file_name) = file_value.as_str() {
                let packet_path = board_dir.join(file_name);
                info!("Loading packets from: {}", packet_path.display());

                if packet_path.exists() {
                    match fs::read_to_string(&packet_path) {
                        Ok(content) => {
                            if content.trim().is_empty() {
                                warn!("Empty packet file: {}", packet_path.display());
                                continue;
                            }

                            match serde_json::from_str::<Vec<Packet>>(&content) {
                                Ok(packets) => {
                                    info!("Loaded {} packets from {}", packets.len(), file_name);
                                    all_packets.extend(packets);
                                }
                                Err(e) => {
                                    warn!(
                                        "Failed to parse packets from {}: {}",
                                        packet_path.display(),
                                        e
                                    );
                                    continue;
                                }
                            }
                        }
                        Err(e) => {
                            warn!(
                                "Failed to read packet file {}: {}",
                                packet_path.display(),
                                e
                            );
                            continue;
                        }
                    }
                } else {
                    warn!("Packet file not found: {}", packet_path.display());
                }
            }
        }

        Ok(all_packets)
    }

    fn load_sockets_from_files(
        socket_files: &[serde_json::Value],
        board_dir: &Path,
    ) -> Result<Vec<Socket>> {
        let mut all_sockets = Vec::new();

        for file_value in socket_files {
            if let Some(file_name) = file_value.as_str() {
                let socket_path = board_dir.join(file_name);
                info!("Loading sockets from: {}", socket_path.display());

                if socket_path.exists() {
                    match fs::read_to_string(&socket_path) {
                        Ok(content) => {
                            if content.trim().is_empty() {
                                warn!("Empty socket file: {}", socket_path.display());
                                continue;
                            }

                            match serde_json::from_str::<Vec<Socket>>(&content) {
                                Ok(sockets) => {
                                    info!("Loaded {} sockets from {}", sockets.len(), file_name);
                                    all_sockets.extend(sockets);
                                }
                                Err(e) => {
                                    warn!(
                                        "Failed to parse sockets from {}: {}",
                                        socket_path.display(),
                                        e
                                    );
                                    continue;
                                }
                            }
                        }
                        Err(e) => {
                            warn!(
                                "Failed to read socket file {}: {}",
                                socket_path.display(),
                                e
                            );
                            continue;
                        }
                    }
                } else {
                    warn!("Socket file not found: {}", socket_path.display());
                }
            }
        }

        Ok(all_sockets)
    }

    fn save_general_info(&self, adj_path: &Path) -> Result<()> {
        let path = adj_path.join("general_info.json");
        let content = serde_json::to_string_pretty(&self.general_info)?;
        fs::write(path, content)?;
        Ok(())
    }

    fn save_board_list(&self, adj_path: &Path) -> Result<()> {
        let path = adj_path.join("boards.json");
        let content = serde_json::to_string_pretty(&self.board_list)?;
        fs::write(path, content)?;
        Ok(())
    }

    fn save_boards(&self, adj_path: &Path) -> Result<()> {
        let boards_dir = adj_path.join("boards");
        fs::create_dir_all(&boards_dir)?;

        // Get list of board names that should exist
        let valid_board_names: std::collections::HashSet<String> = self
            .boards
            .iter()
            .map(|entry| entry.name().clone())
            .collect();

        // Delete board folders that are no longer in the config
        if boards_dir.exists() {
            for entry in fs::read_dir(&boards_dir)? {
                let entry = entry?;
                let dir_name = entry.file_name().to_string_lossy().to_string();
                if entry.path().is_dir() && !valid_board_names.contains(&dir_name) {
                    info!("Removing deleted board directory: {}", dir_name);
                    if let Err(e) = fs::remove_dir_all(entry.path()) {
                        warn!("Failed to remove board directory {}: {}", dir_name, e);
                    }
                }
            }
        }

        for board_entry in &self.boards {
            let board_name = board_entry.name();
            let board = board_entry.board();
            let board_dir = boards_dir.join(board_name);
            fs::create_dir_all(&board_dir)?;

            self.save_board_main(board_name, board, &board_dir)?;
            self.save_board_measurements(board_name, &board.measurements, &board_dir)?;
            self.save_board_packets(&board.packets, &board_dir)?;
            self.save_board_sockets(&board.sockets, &board_dir)?;
        }

        Ok(())
    }

    fn save_board_main(&self, board_name: &str, board: &Board, board_dir: &Path) -> Result<()> {
        let mut main_json = serde_json::json!({
            "board_id": board.board_id,
            "board_ip": board.board_ip,
            "measurements": [format!("{}_measurements.json", board_name)],
            "packets": ["packets.json", "orders.json"]
        });

        if !board.sockets.is_empty() {
            main_json["sockets"] = serde_json::json!(["sockets.json"]);
        }

        let path = board_dir.join(format!("{}.json", board_name));
        let content = serde_json::to_string_pretty(&main_json)?;
        fs::write(path, content)?;
        Ok(())
    }

    fn save_board_measurements(
        &self,
        board_name: &str,
        measurements: &[Measurement],
        board_dir: &Path,
    ) -> Result<()> {
        let path = board_dir.join(format!("{}_measurements.json", board_name));
        let content = serde_json::to_string_pretty(measurements)?;
        fs::write(path, content)?;
        Ok(())
    }

    fn save_board_packets(&self, packets: &[Packet], board_dir: &Path) -> Result<()> {
        // Group packets by type
        let mut data_packets = Vec::new();
        let mut order_packets = Vec::new();

        for packet in packets {
            match packet.packet_type.as_str() {
                "order" => order_packets.push(packet),
                _ => data_packets.push(packet),
            }
        }

        // Save data packets
        if !data_packets.is_empty() {
            let path = board_dir.join("packets.json");
            let content = serde_json::to_string_pretty(&data_packets)?;
            fs::write(path, content)?;
        }

        // Save order packets
        if !order_packets.is_empty() {
            let path = board_dir.join("orders.json");
            let content = serde_json::to_string_pretty(&order_packets)?;
            fs::write(path, content)?;
        }

        Ok(())
    }

    fn save_board_sockets(&self, sockets: &[Socket], board_dir: &Path) -> Result<()> {
        let path = board_dir.join("sockets.json");
        if !sockets.is_empty() {
            let content = serde_json::to_string_pretty(sockets)?;
            fs::write(path, content)?;
        } else {
            // Delete sockets.json if it exists and there are no sockets
            if path.exists() {
                fs::remove_file(path)?;
            }
        }
        Ok(())
    }
}
