# ✅ Setup Completion Checklist

After installing build tools, complete your environment setup:

## 1️⃣ Install System Dependencies (REQUIRED)
```bash
# You must run this with sudo:
sudo apt update && sudo apt install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    clang \
    protobuf-compiler \
    git \
    cmake
```

## 2️⃣ Source Rust Environment
```bash
source $HOME/.cargo/env
```

## 3️⃣ Run Bootstrap Script
```bash
./scripts/bootstrap.sh
```

## 4️⃣ Verify Everything Works
```bash
./scripts/check-env.sh
cargo build --workspace
```

## 5️⃣ Start Phase A Development

Once your environment is ready, begin with Phase A from your master plan:

### Create Canonical Architecture
```bash
mkdir -p docs/architecture
touch docs/architecture/000-architecture-baseline.md
```

### Initialize Substrate Chain
```bash
# After installing substrate tools:
./scripts/install-substrate-tools.sh

# Clone Substrate template:
git clone https://github.com/paritytech/polkadot-sdk
cp -r polkadot-sdk/templates/solochain chain/
```

### Start Building!
- [ ] Create architecture spec
- [ ] Set up Substrate chain
- [ ] Build orchestrator scaffold
- [ ] Define ARI v2 WIT

---

When you hit issues, check:
- GitHub: https://github.com/aidenlippert/ainur
- Master Plan: `ain.plan.md`
- This checklist: `SETUP_COMPLETE.md`
