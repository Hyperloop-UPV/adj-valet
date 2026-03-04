# Rebuild Checklist

Run all commands from the repository root:

```bash
cd /Users/lola/Sync/Server/hyper/adj-valet
```

## One-time setup on a fresh machine

Install the project and packaging dependencies once:

```bash
npm install
npm --prefix frontend install
brew install zig
cargo install cargo-zigbuild --root tools/cargo-zigbuild
```

## Before rebuilding artifacts

Use these checks after changing the frontend or backend:

1. Frontend production build
```bash
npm --prefix frontend run build
```

2. Backend release build for macOS
```bash
cargo build --release --manifest-path backend/Cargo.toml
```

## Rebuild desktop artifacts

3. macOS artifacts
```bash
npm run dist:mac
```

4. Windows artifacts
```bash
npm run dist:win
```

5. Linux and Arch artifacts
```bash
npm run dist:linux
```

6. All platforms
```bash
npm run dist:all
```

## Output locations

Artifacts are written to:

```bash
dist/electron/
```

Typical outputs:

- `npm run dist:mac`
  - `dist/electron/ADJ Valet-0.1.0-arm64.dmg`
  - `dist/electron/ADJ Valet-0.1.0-arm64-mac.zip`
  - `dist/electron/mac-arm64/ADJ Valet.app`
- `npm run dist:win`
  - `dist/electron/ADJ Valet Setup 0.1.0.exe`
  - `dist/electron/ADJ Valet-0.1.0-win.zip`
- `npm run dist:linux`
  - `dist/electron/adj-valet-desktop-0.1.0.pacman`
  - `dist/electron/ADJ Valet-0.1.0.AppImage`
  - `dist/electron/adj-valet-desktop-0.1.0.tar.gz`

## Notes

- `npm run dist:linux` uses your local git name and email as the Linux package maintainer metadata.
- The first cross-platform rebuild on a machine may take longer because Rust targets and Electron packaging binaries are downloaded on demand.
- The frontend currently loads Roboto from Google Fonts at runtime.
