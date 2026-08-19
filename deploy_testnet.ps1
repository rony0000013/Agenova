# ==============================================================================
# Agenova Soroban Smart Contract Testnet Deployment Script (PowerShell)
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  🚀 Deploying Agenova Contracts to Stellar Testnet" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Check prerequisites
$hasCargo = Get-Command cargo -ErrorAction SilentlyContinue
if (-not $hasCargo) {
    Write-Error "Cargo is not found in PATH. Please install Rust and Cargo."
    exit 1
}

# 2. Add WASM Target
Write-Host "`n[1/5] Ensuring wasm32-unknown-unknown target is installed..." -ForegroundColor Yellow
rustup target add wasm32-unknown-unknown

# 3. Build WASM
Write-Host "`n[2/5] Building Soroban contract WASM..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\contract"
cargo build --target wasm32-unknown-unknown --release
if ($LASTEXITCODE -ne 0) {
    Write-Error "WASM build failed."
    exit 1
}

$wasmPath = "$PSScriptRoot\contract\target\wasm32-unknown-unknown\release\agenova_contracts.wasm"
if (-not (Test-Path $wasmPath)) {
    Write-Error "WASM file not found at: $wasmPath"
    exit 1
}
Write-Host "Compiled WASM: $wasmPath" -ForegroundColor Green

# 4. Check for Stellar CLI / Soroban CLI
$cliCmd = $null
if (Get-Command stellar -ErrorAction SilentlyContinue) {
    $cliCmd = "stellar"
} elseif (Get-Command soroban -ErrorAction SilentlyContinue) {
    $cliCmd = "soroban"
}

if (-not $cliCmd) {
    Write-Host "`n[3/5] Stellar CLI / Soroban CLI is not installed locally." -ForegroundColor Yellow
    Write-Host "To install Soroban CLI, run: cargo install --locked soroban-cli" -ForegroundColor Yellow
    Write-Host "`nContract WASM is compiled and 100% ready to deploy at:" -ForegroundColor Green
    Write-Host "$wasmPath" -ForegroundColor Green
    Write-Host "`nManual Deployment Command:" -ForegroundColor Cyan
    Write-Host "soroban contract deploy --wasm `"$wasmPath`" --source <YOUR_IDENTITY> --network testnet" -ForegroundColor White
    exit 0
}

# 5. Configure Network & Identity
Write-Host "`n[3/5] Configuring Stellar Testnet network in $cliCmd..." -ForegroundColor Yellow
& $cliCmd network add testnet `
    --rpc-url "https://soroban-testnet.stellar.org" `
    --network-passphrase "Test SDF Network ; September 2015" `
    2>$null

Write-Host "`n[4/5] Generating and funding deployer keypair..." -ForegroundColor Yellow
& $cliCmd keys generate --network testnet deployer 2>$null
& $cliCmd keys fund deployer --network testnet 2>$null

# 6. Deploy Contract
Write-Host "`n[5/5] Deploying contract to Stellar Testnet..." -ForegroundColor Yellow
$contractId = & $cliCmd contract deploy `
    --wasm "$wasmPath" `
    --source deployer `
    --network testnet

if ($LASTEXITCODE -eq 0 -and $contractId) {
    Write-Host "`n🎉 Contract Successfully Deployed to Testnet!" -ForegroundColor Green
    Write-Host "Contract ID: $contractId" -ForegroundColor Cyan

    # Update backend .env
    $envPath = "$PSScriptRoot\backend\.env"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath -Raw
        $content = $content -replace "AGENT_REGISTRY_ID=.*", "AGENT_REGISTRY_ID=$contractId"
        $content = $content -replace "REVENUE_SHARING_ID=.*", "REVENUE_SHARING_ID=$contractId"
        $content = $content -replace "SERVICE_AGREEMENT_ID=.*", "SERVICE_AGREEMENT_ID=$contractId"
        Set-Content -Path $envPath -Value $content
        Write-Host "Updated backend/.env with contract addresses!" -ForegroundColor Green
    }
} else {
    Write-Host "Deployment command exited. Ensure your deployer account has testnet funds." -ForegroundColor Yellow
}
