# GitHub Setup Instructions

You need to authenticate with GitHub to push your code. Here are your options:

## Option 1: SSH Key (Recommended)

### 1. Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```
- Press Enter to accept default location
- Enter a passphrase (optional but recommended)

### 2. Start SSH Agent and Add Key
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 3. Copy Your Public Key
```bash
cat ~/.ssh/id_ed25519.pub
```

### 4. Add to GitHub
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Paste your public key
4. Save

### 5. Change Remote to SSH
```bash
git remote set-url origin git@github.com:aidenlippert/ainur.git
git push -u origin main
```

## Option 2: Personal Access Token

### 1. Create Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control)
4. Generate and copy token

### 2. Push with Token
```bash
git push -u origin main
```
When prompted:
- Username: your-github-username
- Password: paste-your-token-here

## Option 3: GitHub CLI

### 1. Install GitHub CLI
```bash
# For Ubuntu/Debian
sudo apt update
sudo apt install gh
```

### 2. Authenticate
```bash
gh auth login
```

### 3. Push
```bash
git push -u origin main
```

## After Pushing

Once your code is on GitHub:
1. Visit https://github.com/aidenlippert/ainur
2. You'll see your full Ainur Protocol repository
3. Consider adding topics, description, and enabling features like Issues and Discussions

## Next Steps After GitHub Setup

1. **Install Rust** (required for bootstrap script):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

2. **Run Bootstrap Script**:
   ```bash
   ./scripts/bootstrap.sh
   ```

3. **Set up CI/CD**: GitHub Actions will automatically run when you push

4. **Deploy Documentation**: Connect your repo to Netlify for automatic docs deployment
