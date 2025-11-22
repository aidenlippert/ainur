#!/usr/bin/env bash
set -euo pipefail

# Script to add SSH key to a droplet via console
# Run this in the droplet's console (via DigitalOcean web interface)

SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFsi+Ew7YGe59kfo7fkeTxyP2ED5DriYJiFTZnEUoOIL rocx@DESKTOP-NG8HAPG"

echo "Adding SSH key to this droplet..."

# Create .ssh directory if it doesn't exist
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Add the key if not already present
if ! grep -q "rocx@DESKTOP-NG8HAPG" /root/.ssh/authorized_keys 2>/dev/null; then
  echo "$SSH_KEY" >> /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
  echo "✓ SSH key added successfully"
else
  echo "✓ SSH key already present"
fi

# Verify
echo ""
echo "SSH key fingerprint:"
ssh-keygen -lf /root/.ssh/authorized_keys

echo ""
echo "You can now SSH from your local machine:"
echo "  ssh root@$(curl -s ifconfig.me)"
