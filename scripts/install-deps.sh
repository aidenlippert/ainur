#!/bin/bash
set -e

echo "📦 Installing System Dependencies for Ainur Protocol"
echo "===================================================="
echo ""
echo "This script will install:"
echo "  - Build essentials (gcc, make, etc.)"
echo "  - Development libraries"
echo "  - Substrate/Polkadot dependencies"
echo "  - Additional tools"
echo ""
echo "⚠️  You'll need to enter your sudo password"
echo ""

# Update package list
echo "📋 Updating package list..."
sudo apt update

# Install build essentials
echo "🔧 Installing build essentials..."
sudo apt install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    git \
    clang \
    curl \
    make \
    cmake

# Install Substrate-specific dependencies
echo "⛓️ Installing Substrate dependencies..."
sudo apt install -y \
    libclang-dev \
    protobuf-compiler \
    libprotobuf-dev

# Install additional useful tools
echo "🛠️ Installing additional tools..."
sudo apt install -y \
    jq \
    htop \
    tmux

# Install Node.js (for frontend development)
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Install Rust (if not already installed)
echo "🦀 Checking Rust installation..."
if ! command -v rustc &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
else
    echo "✅ Rust already installed: $(rustc --version)"
fi

echo ""
echo "✅ System dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Run: source $HOME/.cargo/env"
echo "2. Run: ./scripts/bootstrap.sh"
echo "3. Build: cargo build"
