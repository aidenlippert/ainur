#!/usr/bin/env bash
set -euo pipefail

# Usage: bash scripts/deploy-vercel.sh [orchestrator_ip]
# Example: bash scripts/deploy-vercel.sh 138.197.42.173

ORCHESTRATOR_IP=${1:-138.197.42.173}
ORCHESTRATOR_PORT=${2:-8080}
CHAIN_WS_PORT=${3:-9944}

ORCHESTRATOR_URL="http://$ORCHESTRATOR_IP:$ORCHESTRATOR_PORT"
CHAIN_WS="ws://$ORCHESTRATOR_IP:$CHAIN_WS_PORT"

echo "==> Deploying Ainur Web App to Vercel"
echo "==> Orchestrator URL: $ORCHESTRATOR_URL"
echo "==> Chain WebSocket: $CHAIN_WS"

# Navigate to web directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT/web"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "==> Vercel CLI not found. Installing..."
  npm install -g vercel
fi

# Check if already logged in
echo "==> Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
  echo "==> Please log in to Vercel..."
  vercel login
fi

# Link project (if not already linked)
if [ ! -f .vercel/project.json ]; then
  echo "==> Linking Vercel project..."
  echo "Follow the prompts to link or create a new project"
  vercel link
fi

# Set environment variables
echo "==> Setting environment variables..."

# Production environment
vercel env rm NEXT_PUBLIC_ORCHESTRATOR_URL production --yes || true
vercel env add NEXT_PUBLIC_ORCHESTRATOR_URL production <<EOF
$ORCHESTRATOR_URL
EOF

vercel env rm NEXT_PUBLIC_CHAIN_WS production --yes || true
vercel env add NEXT_PUBLIC_CHAIN_WS production <<EOF
$CHAIN_WS
EOF

vercel env rm NEXT_PUBLIC_TOKEN_SYMBOL production --yes || true
vercel env add NEXT_PUBLIC_TOKEN_SYMBOL production <<EOF
AINU
EOF

vercel env rm NEXT_PUBLIC_TOKEN_DECIMALS production --yes || true
vercel env add NEXT_PUBLIC_TOKEN_DECIMALS production <<EOF
12
EOF

vercel env rm NEXT_PUBLIC_NETWORK_NAME production --yes || true
vercel env add NEXT_PUBLIC_NETWORK_NAME production <<EOF
Ainur Testnet
EOF

# Preview environment (optional, same values)
echo "==> Setting preview environment variables..."
vercel env rm NEXT_PUBLIC_ORCHESTRATOR_URL preview --yes || true
vercel env add NEXT_PUBLIC_ORCHESTRATOR_URL preview <<EOF
$ORCHESTRATOR_URL
EOF

vercel env rm NEXT_PUBLIC_CHAIN_WS preview --yes || true
vercel env add NEXT_PUBLIC_CHAIN_WS preview <<EOF
$CHAIN_WS
EOF

vercel env rm NEXT_PUBLIC_TOKEN_SYMBOL preview --yes || true
vercel env add NEXT_PUBLIC_TOKEN_SYMBOL preview <<EOF
AINU
EOF

vercel env rm NEXT_PUBLIC_TOKEN_DECIMALS preview --yes || true
vercel env add NEXT_PUBLIC_TOKEN_DECIMALS preview <<EOF
12
EOF

vercel env rm NEXT_PUBLIC_NETWORK_NAME preview --yes || true
vercel env add NEXT_PUBLIC_NETWORK_NAME preview <<EOF
Ainur Testnet
EOF

echo "==> Environment variables set successfully"

# Deploy to production
echo ""
echo "==> Deploying to production..."
echo "This will build and deploy your app to Vercel"
read -p "Continue with production deployment? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  vercel --prod
  echo ""
  echo "==> Deployment complete!"
  echo "==> Your app should be live at the URL shown above"
else
  echo "Deployment cancelled. You can deploy manually with:"
  echo "  cd web && vercel --prod"
fi

echo ""
echo "Useful commands:"
echo "  vercel --prod                    # Deploy to production"
echo "  vercel                           # Deploy preview"
echo "  vercel env ls                    # List environment variables"
echo "  vercel logs                      # View deployment logs"
echo "  vercel domains                   # Manage domains"
