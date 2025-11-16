#!/bin/bash
set -e

echo "🚀 Bootstrapping Ainur Protocol Development Environment"

# Check prerequisites
command -v rustc >/dev/null 2>&1 || { echo "❌ Rust not installed. Install from https://rustup.rs"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not installed"; exit 1; }

# Install required Rust components
echo "📦 Installing Rust components..."
rustup component add rustfmt clippy
rustup target add wasm32-unknown-unknown

# Install development tools
echo "🔧 Installing development tools..."
cargo install cargo-watch cargo-edit cargo-audit cargo-tarpaulin substrate-contracts-node

# Setup Git hooks
echo "🪝 Setting up Git hooks..."
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
EOF
chmod +x .git/hooks/pre-commit

# Initialize submodules (if any)
git submodule update --init --recursive

# Create necessary directories
mkdir -p {logs,chain-data,.local,benchmarks}

# Setup environment
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Ainur Development Environment
RUST_LOG=info
RUST_BACKTRACE=1
DATABASE_URL=postgresql://localhost/ainur_dev
CHAIN_RPC_URL=ws://localhost:9944
EOF
    echo "✅ Created .env file"
fi

echo "✨ Bootstrap complete! Run 'cargo build' to build the project."
