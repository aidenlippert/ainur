#!/bin/bash
set -e

echo "⛓️ Installing Substrate/Polkadot Development Tools"
echo "=================================================="
echo ""

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust not installed. Please install Rust first."
    exit 1
fi

# Install wasm-pack for WASM development
echo "📦 Installing wasm-pack..."
if ! command -v wasm-pack &> /dev/null; then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
else
    echo "✅ wasm-pack already installed"
fi

# Install substrate-node (from source, as per Polkadot SDK)
echo "🔗 Installing Substrate node template..."
echo "Note: This will clone and build from source"
cargo install --git https://github.com/paritytech/polkadot-sdk --tag polkadot-stable2407 substrate-node-template --locked

# Install subxt-cli for generating runtime metadata
echo "📋 Installing subxt-cli..."
cargo install subxt-cli

# Install cargo-contract for smart contract development (optional)
echo "📄 Installing cargo-contract..."
cargo install cargo-contract --locked

# Install additional helpful tools
echo "🛠️ Installing additional Substrate tools..."
cargo install cargo-expand  # For macro debugging
cargo install cargo-nextest  # Better test runner

echo ""
echo "✅ Substrate tools installation complete!"
echo ""
echo "Installed tools:"
echo "  - substrate-node-template: For creating new chains"
echo "  - subxt-cli: For runtime metadata generation"
echo "  - cargo-contract: For ink! smart contracts"
echo "  - cargo-expand: For debugging macros"
echo "  - cargo-nextest: For better test output"
echo ""
echo "To create a new Substrate chain:"
echo "  substrate-node-new chain-name"
echo ""
echo "Or manually scaffold from the template:"
echo "  git clone https://github.com/paritytech/polkadot-sdk"
echo "  cd polkadot-sdk/templates/solochain"
