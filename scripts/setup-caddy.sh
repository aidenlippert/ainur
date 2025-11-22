#!/bin/bash
# Setup Caddy reverse proxy with auto-HTTPS on orchestrator and RPC droplets

set -e

ORCHESTRATOR_IP="138.197.42.173"
RPC_IP="152.42.207.188"

echo "=== Setting up Caddy on orchestrator droplet ($ORCHESTRATOR_IP) ==="
ssh -i ~/.ssh/temporal-testnet -o StrictHostKeyChecking=no root@$ORCHESTRATOR_IP << 'EOF_ORCH'
set -e

# Install Caddy
echo "Installing Caddy..."
apt-get update
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# Create log directory
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

# Backup original Caddyfile
if [ -f /etc/caddy/Caddyfile ]; then
    cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup
fi

echo "Caddy installed successfully!"
echo "Waiting for Caddyfile to be uploaded..."
EOF_ORCH

echo "Uploading Caddyfile to orchestrator..."
scp -i ~/.ssh/temporal-testnet scripts/Caddyfile.orchestrator root@$ORCHESTRATOR_IP:/etc/caddy/Caddyfile

echo "Starting Caddy on orchestrator..."
ssh -i ~/.ssh/temporal-testnet -o StrictHostKeyChecking=no root@$ORCHESTRATOR_IP << 'EOF_START_ORCH'
set -e

# Validate Caddyfile
caddy validate --config /etc/caddy/Caddyfile

# Enable and start Caddy
systemctl enable caddy
systemctl restart caddy

# Check status
systemctl status caddy --no-pager -l

echo "Caddy is running on orchestrator!"
echo "Waiting for Let's Encrypt certificate issuance..."
sleep 5
journalctl -u caddy --no-pager -n 50 | grep -i "certificate\|acme" || true
EOF_START_ORCH

echo ""
echo "=== Setting up Caddy on RPC droplet ($RPC_IP) ==="
ssh -i ~/.ssh/temporal-testnet -o StrictHostKeyChecking=no root@$RPC_IP << 'EOF_RPC'
set -e

# Install Caddy
echo "Installing Caddy..."
apt-get update
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# Create log directory
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

# Backup original Caddyfile
if [ -f /etc/caddy/Caddyfile ]; then
    cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup
fi

echo "Caddy installed successfully!"
echo "Waiting for Caddyfile to be uploaded..."
EOF_RPC

echo "Uploading Caddyfile to RPC..."
scp -i ~/.ssh/temporal-testnet scripts/Caddyfile.rpc root@$RPC_IP:/etc/caddy/Caddyfile

echo "Starting Caddy on RPC..."
ssh -i ~/.ssh/temporal-testnet -o StrictHostKeyChecking=no root@$RPC_IP << 'EOF_START_RPC'
set -e

# Validate Caddyfile
caddy validate --config /etc/caddy/Caddyfile

# Enable and start Caddy
systemctl enable caddy
systemctl restart caddy

# Check status
systemctl status caddy --no-pager -l

echo "Caddy is running on RPC!"
echo "Waiting for Let's Encrypt certificate issuance..."
sleep 5
journalctl -u caddy --no-pager -n 50 | grep -i "certificate\|acme" || true
EOF_START_RPC

echo ""
echo "==================================================================="
echo "✅ Caddy setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure DNS records:"
echo "   - api.ainur.dev A $ORCHESTRATOR_IP"
echo "   - rpc.ainur.dev A $RPC_IP"
echo ""
echo "2. Wait for DNS propagation (use 'dig api.ainur.dev' to check)"
echo ""
echo "3. Once DNS is live, Caddy will automatically issue Let's Encrypt certificates"
echo ""
echo "4. Update Vercel environment variables:"
echo "   NEXT_PUBLIC_ORCHESTRATOR_URL=https://api.ainur.dev"
echo "   NEXT_PUBLIC_CHAIN_WS=wss://rpc.ainur.dev"
echo ""
echo "5. Test endpoints:"
echo "   curl https://api.ainur.dev/v1/dashboard"
echo "   wscat -c wss://rpc.ainur.dev"
echo "==================================================================="
