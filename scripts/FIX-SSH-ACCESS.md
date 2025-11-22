# Fix SSH Access to Droplets

Your SSH key is added to DigitalOcean but not yet associated with the droplets. Here are two quick ways to fix this:

## Method 1: DigitalOcean Dashboard (Recommended - 2 minutes)

For **each droplet** (alice, bob, charlie):

1. Go to https://cloud.digitalocean.com/droplets
2. Click on the droplet name
3. Click **"Access"** tab at the top
4. Scroll to **"SSH Keys"** section
5. Click **"Add SSH Keys"** button
6. Check the box next to **"temporal-testnet-key"**
7. Click **"Add SSH Key"**

Repeat for all 3 droplets, then run the deployment script again:
```bash
bash scripts/DEPLOY-NOW.sh
```

## Method 2: Console Access (If you prefer terminal - 5 minutes)

For **each droplet**:

1. Go to https://cloud.digitalocean.com/droplets
2. Click on the droplet name
3. Click **"Access"** → **"Launch Droplet Console"** (or "Launch Recovery Console")
4. Log in (you may need to reset root password if you don't have it)
5. Run this **single command**:

```bash
curl -fsSL https://raw.githubusercontent.com/anthropics/claude-code/main/install.sh || \
mkdir -p /root/.ssh && chmod 700 /root/.ssh && \
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFsi+Ew7YGe59kfo7fkeTxyP2ED5DriYJiFTZnEUoOIL rocx@DESKTOP-NG8HAPG" >> /root/.ssh/authorized_keys && \
chmod 600 /root/.ssh/authorized_keys && \
echo "SSH key added successfully"
```

Or copy the `add-ssh-key.sh` script:

```bash
# In the droplet console:
cat > /tmp/add-key.sh << 'EOFKEY'
#!/bin/bash
mkdir -p /root/.ssh && chmod 700 /root/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFsi+Ew7YGe59kfo7fkeTxyP2ED5DriYJiFTZnEUoOIL rocx@DESKTOP-NG8HAPG" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
echo "✓ SSH key added"
EOFKEY

bash /tmp/add-key.sh
```

6. Test SSH access from your local machine:
```bash
ssh root@<DROPLET_IP>
```

7. Repeat for other droplets

## Method 3: Using DigitalOcean CLI (Automated - 1 minute)

If you have `doctl` installed:

```bash
# Install doctl if needed
# snap install doctl
# doctl auth init

# Get your SSH key ID
SSH_KEY_ID=$(doctl compute ssh-key list | grep temporal-testnet-key | awk '{print $1}')

# Get droplet IDs
ALICE_ID=$(doctl compute droplet list | grep validator-alice | awk '{print $1}')
BOB_ID=$(doctl compute droplet list | grep validator-bob | awk '{print $1}')
CHARLIE_ID=$(doctl compute droplet list | grep validator-charlie | awk '{print $1}')

# Add SSH key to each droplet (requires rebuild - WARNING: destroys data)
# This is NOT recommended for existing droplets
```

## After Adding SSH Keys

Test access:
```bash
ssh root@138.197.42.173 "echo 'Alice works'"
ssh root@159.223.238.92 "echo 'Bob works'"
ssh root@139.59.244.156 "echo 'Charlie works'"
```

Then run deployment:
```bash
bash scripts/DEPLOY-NOW.sh
```

## Troubleshooting

**"Permission denied (publickey)"**
- Key not added to droplet yet → Use Method 1 or 2

**"Connection refused"**
- Check droplet is running in DigitalOcean dashboard

**"Connection timeout"**
- Check firewall allows SSH from your IP
- Verify droplet IP address

**"Host key verification failed"**
```bash
ssh-keygen -R 138.197.42.173
ssh-keygen -R 159.223.238.92
ssh-keygen -R 139.59.244.156
```

## Need Help?

If you get stuck, I can:
1. Create a script to use DigitalOcean API (needs token)
2. Guide you through each step
3. Provide alternative deployment methods

Just let me know which method you prefer!
