#!/usr/bin/env bash
set -euo pipefail

# Usage: bash deploy-orchestrator.sh [chain_ws_url]
# Example: bash deploy-orchestrator.sh ws://127.0.0.1:9944

CHAIN_WS_URL=${1:-ws://127.0.0.1:9944}
BIND_ADDR=${BIND_ADDR:-0.0.0.0:8080}
DB_USER=${DB_USER:-ainur}
DB_PASS=${DB_PASS:-ainur}
DB_NAME=${DB_NAME:-ainur}
DB_HOST=${DB_HOST:-127.0.0.1}
DATABASE_URL="postgres://$DB_USER:$DB_PASS@$DB_HOST:5432/$DB_NAME"
ADMIN_IP=${ADMIN_IP:-$(curl -s https://ifconfig.me)}

echo "==> Deploying Ainur Orchestrator API"
echo "==> Chain WebSocket: $CHAIN_WS_URL"
echo "==> Bind address: $BIND_ADDR"
echo "==> Database URL: $DATABASE_URL"

# Install dependencies
echo "==> Installing system dependencies..."
sudo apt update
sudo apt install -y \
  build-essential \
  pkg-config \
  libssl-dev \
  postgresql \
  postgresql-contrib \
  curl \
  jq

# Set up PostgreSQL
echo "==> Setting up PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
echo "==> Creating database and user..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true

# Allow local connections
echo "==> Configuring PostgreSQL authentication..."
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
if [ -f "$PG_HBA" ]; then
  sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_HBA" || true
  sudo systemctl restart postgresql
fi

# Build orchestrator
echo "==> Building orchestrator API..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT/orchestrator/api"

# Build release binary
cargo build --release

# Install binary
echo "==> Installing orchestrator binary..."
sudo install -m 755 target/release/ainur-orchestrator-api /usr/local/bin/ainur-orch

# Run migrations
echo "==> Running database migrations..."
DATABASE_URL="$DATABASE_URL" cargo run --release --bin migrate || true

# Create systemd service
echo "==> Creating systemd service..."
sudo tee /etc/systemd/system/ainur-orch.service >/dev/null <<EOF
[Unit]
Description=Ainur Orchestrator API
After=network-online.target postgresql.service
Wants=network-online.target
Requires=postgresql.service

[Service]
User=root
Type=simple
Environment="DATABASE_URL=$DATABASE_URL"
Environment="CHAIN_WS_URL=$CHAIN_WS_URL"
Environment="BIND_ADDR=$BIND_ADDR"
Environment="RUST_LOG=info,ainur_orchestrator_api=debug"
ExecStart=/usr/local/bin/ainur-orch
Restart=on-failure
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "==> Starting orchestrator service..."
sudo systemctl daemon-reload
sudo systemctl enable ainur-orch
sudo systemctl restart ainur-orch

# Configure firewall for API
echo "==> Configuring firewall for orchestrator API..."
BIND_PORT=$(echo $BIND_ADDR | cut -d':' -f2)
sudo ufw allow from $ADMIN_IP to any port $BIND_PORT proto tcp comment 'Orchestrator API from admin'

# Also allow PostgreSQL locally
sudo ufw allow from 127.0.0.1 to any port 5432 proto tcp comment 'PostgreSQL local'

echo "==> Firewall configured"
sudo ufw status numbered

# Wait for service to start
echo "==> Waiting for service to start..."
sleep 3

# Show logs
echo ""
echo "==> Recent logs:"
sudo journalctl -u ainur-orch -n 30 --no-pager

# Health check
echo ""
echo "==> Health check:"
BIND_PORT=$(echo $BIND_ADDR | cut -d':' -f2)
curl -f http://127.0.0.1:$BIND_PORT/health || echo "Health check failed - service may still be starting"

echo ""
echo "==> Deployment complete!"
echo "==> Service status:"
sudo systemctl status ainur-orch --no-pager -l

echo ""
echo "Useful commands:"
echo "  sudo journalctl -u ainur-orch -f       # Follow logs"
echo "  sudo systemctl restart ainur-orch      # Restart service"
echo "  sudo systemctl status ainur-orch       # Check status"
echo "  curl http://127.0.0.1:$BIND_PORT/health # Health check"
echo ""
echo "API will be available at: http://$(curl -s ifconfig.me):$BIND_PORT"
