#!/usr/bin/env bash
set -euo pipefail

# Complete automated deployment script
# This will deploy everything from your local machine

ALICE_IP="152.42.207.188"
BOB_IP="152.42.205.71"
CHARLIE_IP="152.42.191.137"
SSH_KEY="$HOME/.ssh/temporal-testnet"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHAIN_BINARY="$PROJECT_ROOT/chain/temporal-node/target/release/temporal-node"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"

echo "================================================"
echo "   AINUR NETWORK - COMPLETE DEPLOYMENT"
echo "================================================"
echo ""
echo "This will deploy:"
echo "  ✓ 3 validator nodes (alice, bob, charlie)"
echo "  ✓ PostgreSQL + Orchestrator API on alice"
echo "  ✓ Web app to Vercel"
echo ""
echo "Droplets:"
echo "  alice:   $ALICE_IP (bootnode + orchestrator)"
echo "  bob:     $BOB_IP"
echo "  charlie: $CHARLIE_IP"
echo ""

# Verify chain binary exists
if [ ! -f "$CHAIN_BINARY" ]; then
  echo "ERROR: Chain binary not found at $CHAIN_BINARY"
  echo "Building now..."
  cd "$PROJECT_ROOT/chain/temporal-node"
  cargo build --release
fi

echo "Chain binary: $(du -h $CHAIN_BINARY | cut -f1)"
echo ""

# Test SSH connectivity
echo "Testing SSH connectivity..."
for NAME in alice bob charlie; do
  case $NAME in
    alice) IP=$ALICE_IP ;;
    bob) IP=$BOB_IP ;;
    charlie) IP=$CHARLIE_IP ;;
  esac

  if ! ssh $SSH_OPTS -o ConnectTimeout=5 -o BatchMode=yes "root@$IP" exit 2>/dev/null; then
    echo "ERROR: Cannot SSH to $NAME ($IP)"
    echo "Please ensure:"
    echo "  1. SSH key is added to DigitalOcean"
    echo "  2. You can manually ssh root@$IP"
    exit 1
  fi
  echo "  ✓ $NAME ($IP)"
done
echo ""

echo "Starting deployment..."

echo ""
echo "================================================"
echo "STEP 1: Upload chain binary to all validators"
echo "================================================"
for NAME in alice bob charlie; do
  case $NAME in
    alice) IP=$ALICE_IP ;;
    bob) IP=$BOB_IP ;;
    charlie) IP=$CHARLIE_IP ;;
  esac

  echo "Uploading to $NAME ($IP)..."
  scp $SSH_OPTS -q "$CHAIN_BINARY" "root@$IP:/usr/local/bin/ainur-node"
  ssh $SSH_OPTS "root@$IP" "chmod +x /usr/local/bin/ainur-node"
  echo "  ✓ Uploaded to $NAME"
done
echo ""

echo "================================================"
echo "STEP 2: Deploy validator-alice (bootnode)"
echo "================================================"
scp $SSH_OPTS -q "$SCRIPT_DIR/deploy-validator.sh" "root@$ALICE_IP:/root/"
ssh $SSH_OPTS "root@$ALICE_IP" 'bash /root/deploy-validator.sh alice 2>&1' | tee /tmp/alice-deploy.log

# Extract peer ID
echo "Extracting bootnode peer ID..."
sleep 5
BOOTNODE_PEER=$(ssh $SSH_OPTS "root@$ALICE_IP" "sudo journalctl -u ainur --no-pager | grep 'Local node identity' | tail -1" | grep -oP '12D3[A-Za-z0-9]+' || true)

if [ -z "$BOOTNODE_PEER" ]; then
  echo "ERROR: Could not extract bootnode peer ID"
  echo "Check alice logs:"
  ssh $SSH_OPTS "root@$ALICE_IP" "sudo journalctl -u ainur -n 50"
  exit 1
fi

BOOTNODE_MULTIADDR="/ip4/$ALICE_IP/tcp/30333/p2p/$BOOTNODE_PEER"
echo "  ✓ Bootnode: $BOOTNODE_MULTIADDR"
echo ""

echo "================================================"
echo "STEP 3: Deploy validator-bob"
echo "================================================"
scp $SSH_OPTS -q "$SCRIPT_DIR/deploy-validator.sh" "root@$BOB_IP:/root/"
ssh $SSH_OPTS "root@$BOB_IP" "bash /root/deploy-validator.sh bob '$BOOTNODE_MULTIADDR'"
echo "  ✓ Bob deployed"
echo ""

echo "================================================"
echo "STEP 4: Deploy validator-charlie"
echo "================================================"
scp $SSH_OPTS -q "$SCRIPT_DIR/deploy-validator.sh" "root@$CHARLIE_IP:/root/"
ssh $SSH_OPTS "root@$CHARLIE_IP" "bash /root/deploy-validator.sh charlie '$BOOTNODE_MULTIADDR'"
echo "  ✓ Charlie deployed"
echo ""

echo "================================================"
echo "STEP 5: Verify validator network"
echo "================================================"
echo "Waiting for nodes to peer..."
sleep 10

for NAME in alice bob charlie; do
  case $NAME in
    alice) IP=$ALICE_IP ;;
    bob) IP=$BOB_IP ;;
    charlie) IP=$CHARLIE_IP ;;
  esac

  echo "$NAME ($IP):"
  ssh $SSH_OPTS "root@$IP" 'sudo journalctl -u ainur -n 5 --no-pager | grep -E "(peers|Imported|Finalized)" | tail -3' || echo "  Still starting..."
  echo ""
done

echo "================================================"
echo "STEP 6: Deploy orchestrator on alice"
echo "================================================"

# Copy orchestrator source
echo "Uploading orchestrator source..."
ssh $SSH_OPTS "root@$ALICE_IP" "mkdir -p /root/ainur-network"
scp $SSH_OPTS -q -r "$PROJECT_ROOT/orchestrator" "root@$ALICE_IP:/root/ainur-network/"
scp $SSH_OPTS -q "$SCRIPT_DIR/deploy-orchestrator.sh" "root@$ALICE_IP:/root/"

echo "Deploying orchestrator (this will take 3-5 minutes to compile)..."
ssh $SSH_OPTS "root@$ALICE_IP" "bash /root/deploy-orchestrator.sh ws://127.0.0.1:9944"
echo "  ✓ Orchestrator deployed"
echo ""

echo "================================================"
echo "STEP 7: Configure firewall for public access"
echo "================================================"
ssh $SSH_OPTS "root@$ALICE_IP" "sudo ufw allow 9944/tcp comment 'Chain RPC' && sudo ufw allow 8080/tcp comment 'Orchestrator API' && sudo ufw reload"
echo "  ✓ Ports opened: 9944 (RPC), 8080 (API)"
echo ""

echo "================================================"
echo "STEP 8: Verify deployment"
echo "================================================"

echo "Chain health check:"
if curl -sf "http://$ALICE_IP:9944/health" &>/dev/null; then
  echo "  ✓ Chain RPC responding"
else
  echo "  ✗ Chain RPC not responding (may still be starting)"
fi

echo "Orchestrator health check:"
sleep 3
if curl -sf "http://$ALICE_IP:8080/health" &>/dev/null; then
  echo "  ✓ Orchestrator API responding"
else
  echo "  ✗ Orchestrator API not responding (may still be starting)"
fi
echo ""

echo "================================================"
echo "STEP 9: Deploy web app to Vercel"
echo "================================================"
echo ""
echo "Running Vercel deployment..."
cd "$PROJECT_ROOT/web"

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Login check
if ! vercel whoami &> /dev/null; then
  echo "Please log in to Vercel..."
  vercel login
fi

# Link project
if [ ! -f .vercel/project.json ]; then
  echo "Linking Vercel project..."
  vercel link
fi

# Set environment variables
echo "Setting environment variables..."

# Helper function to set env var
set_vercel_env() {
  local key=$1
  local value=$2
  local env=$3

  vercel env rm "$key" "$env" --yes 2>/dev/null || true
  echo "$value" | vercel env add "$key" "$env" 2>/dev/null || true
}

# Production
set_vercel_env "NEXT_PUBLIC_ORCHESTRATOR_URL" "http://$ALICE_IP:8080" "production"
set_vercel_env "NEXT_PUBLIC_CHAIN_WS" "ws://$ALICE_IP:9944" "production"
set_vercel_env "NEXT_PUBLIC_TOKEN_SYMBOL" "AINU" "production"
set_vercel_env "NEXT_PUBLIC_TOKEN_DECIMALS" "12" "production"
set_vercel_env "NEXT_PUBLIC_NETWORK_NAME" "Ainur Testnet" "production"

# Preview
set_vercel_env "NEXT_PUBLIC_ORCHESTRATOR_URL" "http://$ALICE_IP:8080" "preview"
set_vercel_env "NEXT_PUBLIC_CHAIN_WS" "ws://$ALICE_IP:9944" "preview"
set_vercel_env "NEXT_PUBLIC_TOKEN_SYMBOL" "AINU" "preview"
set_vercel_env "NEXT_PUBLIC_TOKEN_DECIMALS" "12" "preview"
set_vercel_env "NEXT_PUBLIC_NETWORK_NAME" "Ainur Testnet" "preview"

echo "  ✓ Environment variables set"
echo ""

# Deploy
echo "Deploying to Vercel production..."
VERCEL_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^\s]+' | head -1)

echo ""
echo "================================================"
echo "        DEPLOYMENT COMPLETE! 🎉"
echo "================================================"
echo ""
echo "Your Ainur Network is now live:"
echo ""
echo "📡 Validators:"
echo "   alice:   ws://$ALICE_IP:9944"
echo "   bob:     ws://$BOB_IP:9944"
echo "   charlie: ws://$CHARLIE_IP:9944"
echo ""
echo "🔌 Orchestrator API:"
echo "   http://$ALICE_IP:8080"
echo "   Health: http://$ALICE_IP:8080/health"
echo "   Tasks:  http://$ALICE_IP:8080/v1/tasks"
echo ""
echo "🌐 Web Application:"
echo "   $VERCEL_URL"
echo ""
echo "================================================"
echo "Useful Commands:"
echo "================================================"
echo ""
echo "Check validator logs:"
echo "  ssh root@$ALICE_IP sudo journalctl -u ainur -f"
echo ""
echo "Check orchestrator logs:"
echo "  ssh root@$ALICE_IP sudo journalctl -u ainur-orch -f"
echo ""
echo "Health checks:"
echo "  curl http://$ALICE_IP:8080/health"
echo "  curl http://$ALICE_IP:9944/health"
echo ""
echo "Restart services:"
echo "  ssh root@$ALICE_IP sudo systemctl restart ainur"
echo "  ssh root@$ALICE_IP sudo systemctl restart ainur-orch"
echo ""
echo "View Vercel logs:"
echo "  vercel logs"
echo ""
echo "================================================"
