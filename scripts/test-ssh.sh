#!/usr/bin/env bash
# Quick SSH test script

echo "Testing SSH access to all droplets..."
echo ""

ALICE_IP="138.197.42.173"
BOB_IP="159.223.238.92"
CHARLIE_IP="139.59.244.156"

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
echo "If all passed, run: bash scripts/DEPLOY-NOW.sh"
