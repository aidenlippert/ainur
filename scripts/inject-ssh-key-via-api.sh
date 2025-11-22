#!/usr/bin/env bash
set -euo pipefail

# Try to inject SSH key using DigitalOcean API without needing passwords
# This uses a workaround via userdata/cloud-init

ALICE_ID="530742263"
BOB_ID="530742339"
CHARLIE_ID="530742410"

SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFsi+Ew7YGe59kfo7fkeTxyP2ED5DriYJiFTZnEUoOIL rocx@DESKTOP-NG8HAPG"

echo "Attempting to inject SSH key via DigitalOcean API..."
echo ""

# Create a cloud-init script
CLOUD_INIT=$(cat <<'EOF'
#cloud-config
ssh_authorized_keys:
  - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFsi+Ew7YGe59kfo7fkeTxyP2ED5DriYJiFTZnEUoOIL rocx@DESKTOP-NG8HAPG
runcmd:
  - mkdir -p /root/.ssh
  - echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFsi+Ew7YGe59kfo7fkeTxyP2ED5DriYJiFTZnEUoOIL rocx@DESKTOP-NG8HAPG" >> /root/.ssh/authorized_keys
  - chmod 600 /root/.ssh/authorized_keys
  - chmod 700 /root/.ssh
EOF
)

echo "Note: This method requires droplet rebuild which will DESTROY ALL DATA"
echo "This is NOT recommended for existing droplets with data."
echo ""
read -p "Do you want to proceed with rebuild? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled. Please use the password-based method instead:"
  echo "  bash scripts/add-ssh-keys-auto.sh"
  exit 0
fi

# Note: doctl doesn't support updating userdata on existing droplets
# This would require using the REST API directly

echo "Unfortunately, doctl doesn't support updating userdata on existing droplets."
echo "Please use the password-based method:"
echo "  bash scripts/add-ssh-keys-auto.sh"
echo ""
echo "Or check your email for the 3 passwords and run:"
echo "  ssh-copy-id root@138.197.42.173  # alice"
echo "  ssh-copy-id root@159.223.238.92  # bob"
echo "  ssh-copy-id root@139.59.244.156  # charlie"
