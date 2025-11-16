#!/bin/bash
# Safe GitHub SSH Setup Script

echo "🔐 Setting up SSH for GitHub (secure method)"

# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519_github -N ""

# Start SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_github

# Display public key
echo ""
echo "📋 Copy this public key and add it to GitHub:"
echo "   https://github.com/settings/keys"
echo ""
cat ~/.ssh/id_ed25519_github.pub
echo ""

# Configure SSH for GitHub
cat >> ~/.ssh/config << EOF

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github
    IdentitiesOnly yes
EOF

echo "✅ SSH config created"
echo ""
echo "After adding the key to GitHub, run:"
echo "  git remote set-url origin git@github.com:aidenlippert/ainur.git"
echo "  git push"
