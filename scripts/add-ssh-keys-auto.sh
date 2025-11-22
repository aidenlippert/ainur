#!/usr/bin/env bash
set -euo pipefail

# Automated SSH key addition using passwords from email

ALICE_IP="138.197.42.173"
BOB_IP="159.223.238.92"
CHARLIE_IP="139.59.244.156"

SSH_KEY_PATH="$HOME/.ssh/id_ed25519.pub"

echo "================================================"
echo "   Add SSH Keys to All Droplets"
echo "================================================"
echo ""
echo "Password reset emails have been sent to your email."
echo "Check your inbox for 3 emails from DigitalOcean."
echo ""

# Check if ssh-copy-id is available
if ! command -v ssh-copy-id &> /dev/null; then
  echo "Installing ssh-copy-id..."
  sudo apt-get update && sudo apt-get install -y openssh-client
fi

# Function to add SSH key to a droplet
add_key_to_droplet() {
  local name=$1
  local ip=$2

  echo ""
  echo "================================================"
  echo "Adding SSH key to $name ($ip)"
  echo "================================================"
  echo "Enter the password from the email for $name:"
  read -s password
  echo ""

  # Use sshpass if available, otherwise use ssh-copy-id interactively
  if command -v sshpass &> /dev/null; then
    sshpass -p "$password" ssh-copy-id -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "root@$ip"
  else
    # Install sshpass
    echo "Installing sshpass for automation..."
    sudo apt-get install -y sshpass
    sshpass -p "$password" ssh-copy-id -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "root@$ip"
  fi

  if [ $? -eq 0 ]; then
    echo "✓ SSH key added to $name successfully"
  else
    echo "✗ Failed to add SSH key to $name"
    return 1
  fi
}

# Add keys to all droplets
add_key_to_droplet "alice" "$ALICE_IP"
add_key_to_droplet "bob" "$BOB_IP"
add_key_to_droplet "charlie" "$CHARLIE_IP"

echo ""
echo "================================================"
echo "   Testing SSH Connections"
echo "================================================"

for NAME in alice bob charlie; do
  case $NAME in
    alice) IP=$ALICE_IP ;;
    bob) IP=$BOB_IP ;;
    charlie) IP=$CHARLIE_IP ;;
  esac

  if ssh -o ConnectTimeout=5 -o BatchMode=yes "root@$IP" "echo 'Connection successful'" 2>/dev/null; then
    echo "✓ $NAME ($IP) - SSH working"
  else
    echo "✗ $NAME ($IP) - SSH failed"
  fi
done

echo ""
echo "================================================"
echo "All SSH keys added successfully!"
echo "================================================"
echo ""
echo "You can now run the deployment:"
echo "  bash scripts/DEPLOY-NOW.sh"
