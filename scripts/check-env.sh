#!/bin/bash

echo "🔍 Ainur Protocol Environment Check"
echo "==================================="
echo ""

# Check Rust
echo -n "Rust: "
if command -v rustc &> /dev/null; then
    echo "✅ $(rustc --version)"
else
    echo "❌ Not installed"
fi

# Check Cargo
echo -n "Cargo: "
if command -v cargo &> /dev/null; then
    echo "✅ $(cargo --version)"
else
    echo "❌ Not installed"
fi

# Check C compiler
echo -n "C Compiler: "
if command -v gcc &> /dev/null; then
    echo "✅ $(gcc --version | head -n1)"
elif command -v cc &> /dev/null; then
    echo "✅ cc available"
else
    echo "❌ Not installed (run ./scripts/install-deps.sh)"
fi

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    echo "✅ $(node --version)"
else
    echo "⚠️ Not installed (optional, for frontend)"
fi

# Check protobuf
echo -n "Protobuf: "
if command -v protoc &> /dev/null; then
    echo "✅ $(protoc --version)"
else
    echo "⚠️ Not installed (needed for Substrate)"
fi

# Check Git
echo -n "Git: "
if command -v git &> /dev/null; then
    echo "✅ $(git --version)"
else
    echo "❌ Not installed"
fi

# Check WASM target
echo -n "WASM target: "
if rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo "✅ Installed"
else
    echo "⚠️ Not installed (run rustup target add wasm32-unknown-unknown)"
fi

echo ""
echo "📦 Cargo Tools:"
echo -n "  cargo-watch: "
if cargo install --list | grep -q "cargo-watch"; then
    echo "✅ Installed"
else
    echo "⚠️ Not installed"
fi

echo -n "  cargo-edit: "
if cargo install --list | grep -q "cargo-edit"; then
    echo "✅ Installed"
else
    echo "⚠️ Not installed"
fi

echo -n "  cargo-audit: "
if cargo install --list | grep -q "cargo-audit"; then
    echo "✅ Installed"
else
    echo "⚠️ Not installed"
fi

echo -n "  cargo-tarpaulin: "
if cargo install --list | grep -q "cargo-tarpaulin"; then
    echo "✅ Installed"
else
    echo "⚠️ Not installed"
fi

echo ""
echo "🏗️ Build Test:"
cd /home/rocx/ainur-network
if cargo check --workspace &> /dev/null; then
    echo "✅ Workspace builds successfully!"
else
    echo "❌ Build failed - check dependencies"
fi

echo ""
echo "---"
echo "If you see any ❌ or ⚠️, run the appropriate installer script."
