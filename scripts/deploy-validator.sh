#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   On alice:  bash deploy-validator.sh alice
#   On bob:    bash deploy-validator.sh bob <BOOTNODE_PEER>
#   On charlie: bash deploy-validator.sh charlie <BOOTNODE_PEER>
#
# Example BOOTNODE_PEER: /ip4/138.197.42.173/tcp/30333/p2p/12D3KooW...

NODE_NAME=${1:-alice}
BOOTNODE_PEER=${2:-""}
WS_PORT=9944
P2P_PORT=30333
ADMIN_IP=${ADMIN_IP:-$(curl -s https://ifconfig.me)}

echo "==> Deploying Ainur validator node: $NODE_NAME"
echo "==> Admin IP for firewall: $ADMIN_IP"

# Update system
echo "==> Updating system packages..."
sudo apt update
sudo apt install -y curl jq ufw build-essential

# Install node binary
# TODO: Replace this URL with your actual compiled binary
echo "==> Installing node binary..."
if [ ! -f /usr/local/bin/ainur-node ]; then
  # Placeholder - replace with actual binary URL or copy from local
  echo "ERROR: Please upload your compiled ainur-node binary to /usr/local/bin/ainur-node"
  echo "You can build it with: cargo build --release in chain/ directory"
  exit 1
fi
sudo chmod +x /usr/local/bin/ainur-node

# Create systemd service
echo "==> Creating systemd service..."
BOOTNODE_ARG=""
if [ -n "$BOOTNODE_PEER" ]; then
  BOOTNODE_ARG="--bootnodes $BOOTNODE_PEER"
fi

sudo tee /etc/systemd/system/ainur.service >/dev/null <<EOF
[Unit]
Description=Ainur Validator Node ($NODE_NAME)
After=network-online.target
Wants=network-online.target

[Service]
User=root
Type=simple
Environment="RUST_LOG=info"
ExecStart=/usr/local/bin/ainur-node \\
  --chain dev \\
  --validator \\
  --name $NODE_NAME \\
  --ws-external \\
  --rpc-cors all \\
  --rpc-methods=Unsafe \\
  --prometheus-external \\
  --port $P2P_PORT \\
  --ws-port $WS_PORT \\
  $BOOTNODE_ARG
Restart=on-failure
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "==> Starting ainur service..."
sudo systemctl daemon-reload
sudo systemctl enable ainur
sudo systemctl restart ainur

# Configure firewall - DISABLED FOR NOW
echo "==> Skipping UFW configuration (can enable manually later)"
# Firewall disabled to avoid lockout during deployment
# To enable later:
# sudo ufw allow 22/tcp
# sudo ufw allow 30333/tcp
# sudo ufw allow 9944/tcp
# sudo ufw enable

# Wait for node to start
echo "==> Waiting for node to initialize..."
sleep 5

# Show logs and peer ID
echo ""
echo "==> Recent logs:"
sudo journalctl -u ainur -n 30 --no-pager

echo ""
echo "==> Checking for Local node identity..."
PEER_ID=$(sudo journalctl -u ainur --no-pager | grep "Local node identity" | tail -1 || true)
if [ -n "$PEER_ID" ]; then
  echo "$PEER_ID"
  echo ""
  echo "For bob/charlie, use this as BOOTNODE_PEER:"
  echo "$PEER_ID" | sed -n 's/.*Local node identity is: \(.*\)/\/ip4\/$(curl -s ifconfig.me)\/tcp\/30333\/\1/p'
fi

echo ""
echo "==> Deployment complete!"
echo "==> Service status:"
sudo systemctl status ainur --no-pager -l

echo ""
echo "Useful commands:"
echo "  sudo journalctl -u ainur -f          # Follow logs"
echo "  sudo systemctl restart ainur         # Restart service"
echo "  sudo systemctl status ainur          # Check status"
echo "  curl http://127.0.0.1:$WS_PORT/health # Health check"
