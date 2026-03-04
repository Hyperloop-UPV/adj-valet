#!/bin/bash

# ADJ Valet Release Script
set -e

VERSION=${1:-"v1.0.0"}
# Detect the native target
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [[ $(uname -m) == "arm64" ]]; then
        TARGET=${2:-"aarch64-apple-darwin"}
    else
        TARGET=${2:-"x86_64-apple-darwin"}
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    TARGET=${2:-"x86_64-unknown-linux-gnu"}
else
    TARGET=${2:-"x86_64-unknown-linux-gnu"}
fi
RELEASE_DIR="release"

echo "Building ADJ Valet $VERSION for $TARGET..."

# Clean up previous builds
rm -rf $RELEASE_DIR
mkdir -p $RELEASE_DIR/adj-valet

# Build frontend
echo "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Build backend
echo "Building backend..."
cd backend
if rustup target list --installed | grep -q "$TARGET"; then
    cargo build --release --target $TARGET
else
    echo "Installing target $TARGET..."
    rustup target add $TARGET
    cargo build --release --target $TARGET
fi
cd ..

# Copy files
echo "Packaging release..."
cp backend/target/$TARGET/release/backend $RELEASE_DIR/adj-valet/adj-valet-backend
chmod +x $RELEASE_DIR/adj-valet/adj-valet-backend

cp -r frontend/dist $RELEASE_DIR/adj-valet/web
cp README.md $RELEASE_DIR/adj-valet/
# cp adj/README.md $RELEASE_DIR/adj-valet/ADJ-SPEC.md

# Create startup script
cat > $RELEASE_DIR/adj-valet/start.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting ADJ Valet..."
echo "Backend will be available at http://localhost:8000"
echo "Opening web interface..."

# Start backend in background
./adj-valet-backend --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Try to open in browser
if command -v xdg-open > /dev/null; then
    xdg-open "file://$(pwd)/web/index.html"
elif command -v open > /dev/null; then
    open "file://$(pwd)/web/index.html"
else
    echo "Please open file://$(pwd)/web/index.html in your browser"
fi

echo "Press Ctrl+C to stop the server"
wait $BACKEND_PID
EOF
chmod +x $RELEASE_DIR/adj-valet/start.sh

# Create archive
cd $RELEASE_DIR
tar czf adj-valet-$VERSION-$TARGET.tar.gz adj-valet/
cd ..

echo "Release created: $RELEASE_DIR/adj-valet-$VERSION-$TARGET.tar.gz"
echo "To test: cd $RELEASE_DIR/adj-valet && ./start.sh"
