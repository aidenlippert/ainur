#!/usr/bin/env bash
set -euo pipefail

# Quick deployment script for all validators and orchestrator
# This script copies files and runs deployment from your local machine

ALICE_IP="138.197.42.173"
BOB_IP="159.223.238.92"
CHARLIE_IP="139.59.244.156"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "==> Ainur Network - Quick Deployment Script"
echo "This script will deploy all validators and the orchestrator"
echo ""
echo "Droplets:"
echo "  alice:   $ALICE_IP"
echo "  bob:     $BOB_IP"
echo "  charlie: $CHARLIE_IP"
echo ""

# Check if we have a chain binary
if [ ! -f "$PROJECT_ROOT/chain/target/release/node-template" ]; then
  echo "ERROR: Chain binary not found!"
  echo "Please build your chain binary first:"
  echo "  cd chain"
  echo "  cargo build --release"
  exit 1
fi

read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Deployment cancelled"
  exit 0
fi

# Step 1: Upload chain binary to all droplets
echo ""
echo "==> Step 1: Uploading chain binary to all droplets..."
for IP in $ALICE_IP $BOB_IP $CHARLIE_IP; do
  echo "Uploading to $IP..."
  scp "$PROJECT_ROOT/chain/target/release/node-template" "root@$IP:/usr/local/bin/ainur-node" || {
    echo "Failed to upload to $IP"
    exit 1
  }
done
echo "Chain binary uploaded successfully"

# Step 2: Deploy alice (bootnode)
echo ""
echo "==> Step 2: Deploying validator-alice (bootnode)..."
scp "$SCRIPT_DIR/deploy-validator.sh" "root@$ALICE_IP:/root/"
ssh "root@$ALICE_IP" 'bash /root/deploy-validator.sh alice' | tee /tmp/alice-deploy.log

# Extract peer ID from alice's output
BOOTNODE_PEER=$(grep -oP '/ip4/[0-9.]+/tcp/30333/p2p/[A-Za-z0-9]+' /tmp/alice-deploy.log | tail -1)

if [ -z "$BOOTNODE_PEER" ]; then
  echo "ERROR: Could not extract bootnode peer ID from alice"
  echo "Please check alice's deployment logs and get the peer ID manually"
  echo "Then run bob and charlie deployments manually with:"
  echo "  bash scripts/deploy-validator.sh bob <BOOTNODE_PEER>"
  exit 1
fi

echo ""
echo "Bootnode peer ID: $BOOTNODE_PEER"

# Step 3: Deploy bob
echo ""
echo "==> Step 3: Deploying validator-bob..."
scp "$SCRIPT_DIR/deploy-validator.sh" "root@$BOB_IP:/root/"
ssh "root@$BOB_IP" "bash /root/deploy-validator.sh bob '$BOOTNODE_PEER'"

# Step 4: Deploy charlie
echo ""
echo "==> Step 4: Deploying validator-charlie..."
scp "$SCRIPT_DIR/deploy-validator.sh" "root@$CHARLIE_IP:/root/"
ssh "root@$CHARLIE_IP" "bash /root/deploy-validator.sh charlie '$BOOTNODE_PEER'"

# Step 5: Wait a bit for validators to connect
echo ""
echo "==> Waiting for validators to connect..."
sleep 10

# Step 6: Verify peering
echo ""
echo "==> Step 5: Verifying validator network..."
for NAME in alice bob charlie; do
  case $NAME in
    alice) IP=$ALICE_IP ;;
    bob) IP=$BOB_IP ;;
    charlie) IP=$CHARLIE_IP ;;
  esac

  echo ""
  echo "Checking $NAME ($IP)..."
  ssh "root@$IP" 'sudo journalctl -u ainur -n 10 | grep -E "(peers|Imported|Finalized)"' || true
done

# Step 7: Deploy orchestrator on alice
echo ""
echo "==> Step 6: Deploying orchestrator on alice..."
scp "$SCRIPT_DIR/deploy-orchestrator.sh" "root@$ALICE_IP:/root/"
scp -r "$PROJECT_ROOT/orchestrator" "root@$ALICE_IP:/root/ainur-network/"
ssh "root@$ALICE_IP" 'bash /root/deploy-orchestrator.sh ws://127.0.0.1:9944'

# Step 8: Open firewall for external access
echo ""
echo "==> Step 7: Configuring firewall for external access..."
ssh "root@$ALICE_IP" 'sudo ufw allow 9944/tcp && sudo ufw allow 8080/tcp && sudo ufw reload'

# Step 9: Verify orchestrator
echo ""
echo "==> Step 8: Verifying orchestrator..."
sleep 3
curl -f "http://$ALICE_IP:8080/health" && echo "✓ Orchestrator health check passed" || echo "✗ Orchestrator health check failed"

# Step 10: Deploy web app
echo ""
echo "==> Step 9: Ready to deploy web app to Vercel"
echo ""
echo "Run this command from your local machine:"
echo "  bash scripts/deploy-vercel.sh $ALICE_IP"
echo ""

# Summary
echo ""
echo "================================================"
echo "==> Deployment Complete!"
echo "================================================"
echo ""
echo "Validator network:"
echo "  alice:   http://$ALICE_IP:9944"
echo "  bob:     http://$BOB_IP:9944"
echo "  charlie: http://$CHARLIE_IP:9944"
echo ""
echo "Orchestrator API:"
echo "  http://$ALICE_IP:8080"
echo ""
echo "Next steps:"
echo "  1. Deploy web app: bash scripts/deploy-vercel.sh $ALICE_IP"
echo "  2. Check validator logs: ssh root@$ALICE_IP sudo journalctl -u ainur -f"
echo "  3. Monitor orchestrator: ssh root@$ALICE_IP sudo journalctl -u ainur-orch -f"
echo ""
echo "Useful commands:"
echo "  curl http://$ALICE_IP:8080/health          # Check orchestrator"
echo "  curl http://$ALICE_IP:9944/health          # Check chain RPC"
echo ""
