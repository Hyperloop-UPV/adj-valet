# ADJ Valet

<div align="center">
  <img src="frontend/src/assets/monkey.svg" alt="ADJ Valet Logo" width="120" />
  
  **A configuration management tool for Hyperloop control systems**
  
  [![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![Axum](https://img.shields.io/badge/Axum-Latest-blue.svg)](https://github.com/tokio-rs/axum)
  [![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
</div>

## Overview

ADJ Valet is a web-based configuration management tool designed for the Hyperloop Control Station's ADJ (Automatic Data Junction). It provides an intuitive interface for managing board configurations, network packets, and measurement parameters critical to Hyperloop pod operations.

### Key Features

- 🎛️ **Board Management**: Configure board IDs, IP addresses, and associated parameters
- 📦 **Packet Configuration**: Define and manage network packet structures
- 📊 **Measurement Setup**: Configure measurement parameters with safety thresholds
- 💾 **File-Based Storage**: Maintains configuration in organized JSON file structures
- 🔄 **Real-time Updates**: Live synchronization between UI and file system

## Quick Start

### Option 1: Download Pre-built Release (Easiest)

1. **Download** the latest release for your platform from [Releases](https://github.com/HyperloopUPV-H8/adj-valet/releases)
   - Windows (Intel/AMD): `adj-valet-x86_64-pc-windows-msvc.zip`
   - Windows (ARM): `adj-valet-aarch64-pc-windows-msvc.zip`
   - macOS (Intel): `adj-valet-x86_64-apple-darwin.tar.gz`
   - macOS (Apple Silicon): `adj-valet-aarch64-apple-darwin.tar.gz`
   - Linux: `adj-valet-x86_64-unknown-linux-gnu.tar.gz`

2. **Extract** the archive
3. **Run** the startup script:
   - Windows: Double-click `start.bat`
   - macOS/Linux: Double-click `start.sh` or run `./start.sh`

### Option 2: Using the Run Script (Development)

```bash
# Clone the repository
git clone https://github.com/HyperloopUPV-H8/adj-valet.git
cd adj-valet

# Start the application
./run.sh

# Or run specific components
./run.sh backend   # Backend only
./run.sh frontend  # Frontend only
```

### Option 3: Build the Electron Desktop App

```bash
# Install root Electron tooling
npm install

# Build a desktop package for the current platform
npm run dist
```

This produces installers or archives in `dist/electron/` and bundles:
- the React frontend from `frontend/dist`
- the Rust backend binary from `backend/target/release`

For repeat rebuilds after frontend or backend changes, see [REBUILD.md](/Users/lola/Sync/Server/hyper/adj-valet/REBUILD.md).

### Option 4: Using Nix Shell

```bash
# Enter the Nix development shell
nix-shell

# Run the full application
adj-valet

# Or run components separately
adj-backend   # Backend service only
adj-frontend  # Frontend application only
```

## Installation

### Prerequisites

- **Rust** 1.70 or higher
- **Node.js** 18 or higher
- **npm** 8 or higher

### Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HyperloopUPV-H8/adj-valet.git
   cd adj-valet
   ```

2. **Build backend (Rust)**
   ```bash
   cd backend
   cargo build --release
   cd ..
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Start the services**
   ```bash
   # Terminal 1 - Backend
   cd backend
   cargo run -- --port 8000

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Development

### Available Commands

#### Standard Development
```bash
./run.sh             # Start full application
./run.sh backend     # Start backend only
./run.sh frontend    # Start frontend only
./run.sh install     # Install all dependencies
./run.sh help        # Show help information
```

#### Nix Shell Commands
```bash
nix-shell            # Enter development environment
adj-valet            # Run full application
adj-backend          # Run backend service
adj-frontend         # Run frontend application
format-python        # Format Python code with Black
lint-python          # Lint Python code with Pylint
```

### Project Structure

```
adj-valet/
├── backend/              # Rust backend service (Axum)
│   ├── src/
│   │   ├── main.rs      # Main application and API endpoints
│   │   ├── config.rs    # Configuration management
│   │   └── error.rs     # Error handling
│   └── Cargo.toml       # Rust dependencies
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── store/      # Zustand state management
│   │   ├── types/      # TypeScript type definitions
│   │   └── api/        # API client
│   └── package.json
├── electron/            # Electron main-process files and staged assets
├── scripts/             # Desktop packaging helpers
├── run.sh              # Application runner script
├── shell.nix           # Nix development environment
└── CLAUDE.md           # AI assistant documentation
```

### API Endpoints

- `POST /path` - Set the ADJ directory path
- `GET /assemble` - Retrieve assembled configuration
- `POST /update` - Update configuration changes

### Frontend Routes

The application provides a single-page interface with:
- General Information management
- Board configuration panels
- Packet and measurement editors

## Configuration

### Environment Variables

The application creates a `.env` file with default values:

```env
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_PORT=5173
```

### ADJ Directory Structure

The application expects an ADJ directory with the following structure:

```
your-adj-directory/
├── general_info.json
├── boards.json
└── boards/
    ├── BoardA/
    │   ├── BoardA.json
    │   ├── measurements.json
    │   └── packets/
    │       ├── order_0.json
    │       └── order_1.json
    └── BoardB/
        └── ...
```

## Usage Guide

1. **Start the application** using one of the methods above

2. **Enter your ADJ directory path** when prompted

3. **Navigate through sections**:
   - **General Info**: View and edit general configuration
   - **Boards**: Manage board configurations
   - **Packets**: Define packet structures
   - **Measurements**: Configure measurement parameters

4. **Save changes** using the save button in the sidebar

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint configuration for TypeScript/React
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## Troubleshooting

### Common Issues

1. **Backend connection errors**
   - Ensure the backend is running on port 8000
   - Check that no other service is using the port

2. **Frontend build errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Ensure Node.js version is 18 or higher

3. **File permission errors**
   - Ensure the ADJ directory has write permissions
   - Check that all JSON files are properly formatted

## License

This project is part of the Hyperloop UPV project. For licensing information, please contact the team.

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/HyperloopUPV-H8/adj-valet/issues)
- Contact the Hyperloop UPV team

---

<div align="center">
  Made with ❤️ by Hyperloop UPV Team
</div>
