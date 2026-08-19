#!/usr/bin/env bash
set -e

echo "======================================================"
echo "  🚀 Deploying Agenova Contracts to Stellar Testnet"
echo "======================================================"

# 1. Add WASM Target
echo -e "\n[1/5] Ensuring wasm32-unknown-unknown target is installed..."
rustup target add wasm32-unknown-unknown

# 2. Build WASM
echo -e "\n[2/5] Building Soroban contract WASM..."
cd "$(dirname "$0")/contract"
cargo build --target wasm32-unknown-unknown --release

WASM_PATH="$(dirname "$0")/contract/target/wasm32-unknown-unknown/release/agenova_contracts.wasm"
if [ ! -f "$WASM_PATH" ]; then
    echo "Error: WASM file not found at $WASM_PATH"
    exit 1
fi
echo "Compiled WASM: $WASM_PATH"

# 3. Check for Stellar / Soroban CLI
CLI_CMD=""
if command -v stellar &> /dev/null; then
    CLI_CMD="stellar"
elif command -v soroban &> /dev/null; then
    CLI_CMD="soroban"
fi

if [ -z "$CLI_CMD" ]; then
    echo -e "\n[3/5] Stellar CLI / Soroban CLI not detected."
    echo "Install via: cargo install --locked soroban-cli"
    echo "Contract WASM is compiled and ready for deployment at: $WASM_PATH"
    exit 0
fi

# 4. Configure Testnet & Identity
echo -e "\n[3/5] Configuring Testnet..."
$CLI_CMD network add testnet \
    --rpc-url "https://soroban-testnet.stellar.org" \
    --network-passphrase "Test SDF Network ; September 2015" || true

echo -e "\n[4/5] Generating deployer keypair & funding via Friendbot..."
$CLI_CMD keys generate --network testnet deployer || true
$CLI_CMD keys fund deployer --network testnet || true

# 5. Deploy Contract
echo -e "\n[5/5] Deploying contract to Testnet..."
CONTRACT_ID=$($CLI_CMD contract deploy \
    --wasm "$WASM_PATH" \
    --source deployer \
    --network testnet)

echo -e "\n🎉 Contract Successfully Deployed to Stellar Testnet!"
echo "Contract ID: $CONTRACT_ID"
