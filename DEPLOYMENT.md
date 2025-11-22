# Ainur Network - Complete Deployment Runbook

This guide will walk you through deploying a 3-node Ainur validator network on DigitalOcean, setting up the orchestrator API, and deploying the web frontend to Vercel.

## Overview

- **validator-alice** (138.197.42.173, NYC3): Bootnode + validator
- **validator-bob** (159.223.238.92, AMS3): Validator
- **validator-charlie** (139.59.244.156, SGP1): Validator
- **Orchestrator**: Run on alice (or separate droplet)
- **Web App**: Deploy to Vercel

## Prerequisites

1. SSH key added to DigitalOcean (you've already done this)
2. SSH access to all three droplets
3. Vercel account
4. Local machine with Rust and Node.js installed

## Step 1: Build the Chain Binary

On your **local machine**, build the Substrate node:

```bash
# Navigate to project root
cd /home/rocx/ainur-network

# Build the chain binary (this will take a while)
# Note: You need to create your chain/ directory with Substrate node implementation
# For now, we'll use a substrate template or your custom chain
cd chain
cargo build --release

# The binary will be at: target/release/node-template (or your binary name)
```

**Upload the binary to all droplets:**

```bash
# For alice
scp target/release/node-template root@138.197.42.173:/usr/local/bin/ainur-node

# For bob
scp target/release/node-template root@159.223.238.92:/usr/local/bin/ainur-node

# For charlie
scp target/release/node-template root@139.59.244.156:/usr/local/bin/ainur-node
```

## Step 2: Deploy validator-alice (Bootnode)

SSH into alice and run the deployment script:

```bash
# Copy the script to alice
scp scripts/deploy-validator.sh root@138.197.42.173:/root/

# SSH into alice
ssh root@138.197.42.173

# Make script executable and run
chmod +x /root/deploy-validator.sh
bash /root/deploy-validator.sh alice

# IMPORTANT: Copy the peer ID from the output
# It will look like: /ip4/138.197.42.173/tcp/30333/p2p/12D3KooW...
# You'll need this for bob and charlie
```

**Save the peer ID** - you'll use it as `BOOTNODE_PEER` for the other validators.

Example:
```
BOOTNODE_PEER="/ip4/138.197.42.173/tcp/30333/p2p/12D3KooWExamplePeerID123456789"
```

## Step 3: Deploy validator-bob

```bash
# Copy the script to bob
scp scripts/deploy-validator.sh root@159.223.238.92:/root/

# SSH into bob
ssh root@159.223.238.92

# Run with bootnode peer from alice
chmod +x /root/deploy-validator.sh
bash /root/deploy-validator.sh bob "/ip4/138.197.42.173/tcp/30333/p2p/12D3KooW..."
```

## Step 4: Deploy validator-charlie

```bash
# Copy the script to charlie
scp scripts/deploy-validator.sh root@139.59.244.156:/root/

# SSH into charlie
ssh root@139.59.244.156

# Run with bootnode peer from alice
chmod +x /root/deploy-validator.sh
bash /root/deploy-validator.sh charlie "/ip4/138.197.42.173/tcp/30333/p2p/12D3KooW..."
```

## Step 5: Verify Validator Network

On any validator, check the logs to confirm peering:

```bash
# Check logs
sudo journalctl -u ainur -f

# Look for messages like:
# "Discovered new external address"
# "Syncing, target=#123 (3 peers)"
# "Imported #1"
```

You should see 3 peers connected on each node.

## Step 6: Deploy Orchestrator (on alice)

The orchestrator will run on alice alongside the validator.

```bash
# On your local machine, copy the deployment script
scp scripts/deploy-orchestrator.sh root@138.197.42.173:/root/
scp -r orchestrator root@138.197.42.173:/root/ainur-network/

# SSH into alice
ssh root@138.197.42.173

# Run orchestrator deployment
chmod +x /root/deploy-orchestrator.sh
bash /root/deploy-orchestrator.sh ws://127.0.0.1:9944

# Verify it's running
curl http://127.0.0.1:8080/health
```

## Step 7: Configure Firewall for External Access

By default, the scripts only allow access from your IP. To allow public access to the orchestrator and RPC:

```bash
# On alice, allow public access to specific ports
sudo ufw allow 9944/tcp comment 'Chain WebSocket RPC'
sudo ufw allow 8080/tcp comment 'Orchestrator API'
sudo ufw reload

# Verify
curl http://138.197.42.173:8080/health
```

**Security Warning**: In production, you should:
- Use a reverse proxy (nginx) with SSL
- Implement rate limiting
- Restrict RPC methods
- Use proper authentication

## Step 8: Deploy Web App to Vercel

On your **local machine**:

```bash
# Navigate to project root
cd /home/rocx/ainur-network

# Make the script executable
chmod +x scripts/deploy-vercel.sh

# Run the deployment script
# Replace 138.197.42.173 with alice's IP if different
bash scripts/deploy-vercel.sh 138.197.42.173

# Follow the prompts:
# 1. Log in to Vercel (opens browser)
# 2. Link to existing project or create new one
# 3. Confirm production deployment
```

The script will:
- Install Vercel CLI (if needed)
- Authenticate with Vercel
- Set all environment variables
- Deploy to production

## Step 9: Verify Everything

### Check Validators

```bash
# On each validator
ssh root@<VALIDATOR_IP>
sudo journalctl -u ainur -n 50
```

Look for:
- Block production: `Prepared block for proposing`
- Finalization: `Finalized block`
- Peers: `3 peers` or `2 peers`

### Check Orchestrator

```bash
# Health check
curl http://138.197.42.173:8080/health

# List tasks
curl http://138.197.42.173:8080/v1/tasks

# Check chain connection
ssh root@138.197.42.173
sudo journalctl -u ainur-orch -f
```

### Check Web App

1. Visit your Vercel deployment URL
2. Check browser console for errors
3. Try connecting wallet
4. Verify chain connection status

## Troubleshooting

### Validators not peering

```bash
# Check bootnode peer ID is correct
ssh root@138.197.42.173
sudo journalctl -u ainur | grep "Local node identity"

# Check firewall allows P2P
sudo ufw status
# Should show port 30333 allowed

# Check bob/charlie have correct bootnode in service file
sudo cat /etc/systemd/system/ainur.service | grep bootnodes
```

### Orchestrator can't connect to chain

```bash
# Check chain is running
curl http://127.0.0.1:9944/health

# Check orchestrator logs
sudo journalctl -u ainur-orch -f

# Verify CHAIN_WS_URL in service file
sudo cat /etc/systemd/system/ainur-orch.service | grep CHAIN_WS_URL
```

### Web app can't connect

1. Check orchestrator is accessible: `curl http://138.197.42.173:8080/health`
2. Check CORS settings allow your domain
3. Verify environment variables in Vercel dashboard
4. Check browser console for specific errors

### Database errors

```bash
# On orchestrator host
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"  # List databases
sudo -u postgres psql ainur -c "\dt"  # List tables

# Check connection
PGPASSWORD=ainur psql -h 127.0.0.1 -U ainur -d ainur -c "SELECT 1;"
```

## Useful Commands

### Validators

```bash
# View logs
sudo journalctl -u ainur -f

# Restart validator
sudo systemctl restart ainur

# Check status
sudo systemctl status ainur

# View service config
sudo cat /etc/systemd/system/ainur.service
```

### Orchestrator

```bash
# View logs
sudo journalctl -u ainur-orch -f

# Restart orchestrator
sudo systemctl restart ainur-orch

# Check status
sudo systemctl status ainur-orch

# Test API endpoints
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/tasks
```

### Vercel

```bash
# Deploy to production
cd web && vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# View environment variables
vercel env ls
```

## Next Steps

After deployment:

1. **Set up monitoring**: Use Prometheus + Grafana for validator metrics
2. **Configure alerts**: Set up alerts for downtime, missed blocks
3. **Secure the API**: Add authentication, rate limiting, SSL
4. **Set up backups**: Regular backups of chain data and database
5. **Document operations**: Create runbooks for common tasks
6. **Test failover**: Verify system behavior when nodes go down

## Emergency Contacts

- Validator issues: Check `sudo journalctl -u ainur -f`
- Orchestrator issues: Check `sudo journalctl -u ainur-orch -f`
- Web app issues: Check Vercel dashboard logs
- Database issues: Check PostgreSQL logs

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         End Users                               │
│                  (Browser / Wallet)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
                    ┌────────────────┐
                    │  Vercel CDN    │
                    │   (Web App)    │
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                │ HTTP                    │ WebSocket
                ▼                         ▼
    ┌──────────────────────┐   ┌────────────────────┐
    │   Orchestrator API   │   │   validator-alice  │
    │  (138.197.42.173:    │   │  (138.197.42.173:  │
    │      8080)           │───│      9944)         │
    └──────────────────────┘   └─────────┬──────────┘
              │                          │
              │ PostgreSQL               │ P2P
              │                          │
    ┌─────────▼──────────┐      ┌────────┴──────────┐
    │   Database         │      │                   │
    └────────────────────┘      │                   │
                         ┌──────▼──────┐   ┌────────▼──────┐
                         │validator-bob│   │validator-     │
                         │(159.223.238 │   │  charlie      │
                         │    .92)     │   │(139.59.244.   │
                         └─────────────┘   │   156)        │
                                           └───────────────┘
```

## Files Created

- `scripts/deploy-validator.sh` - Validator deployment script
- `scripts/deploy-orchestrator.sh` - Orchestrator deployment script
- `scripts/deploy-vercel.sh` - Vercel deployment script
- `web/.env.production.template` - Environment variable template

All scripts are idempotent and can be re-run safely.
