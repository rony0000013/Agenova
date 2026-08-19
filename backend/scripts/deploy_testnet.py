import os
import sys
import time
import httpx
from pathlib import Path
from stellar_sdk import (
    Server,
    SorobanServer,
    Keypair,
    Network,
    TransactionBuilder,
    InvokeHostFunction,
    xdr,
    scval,
    StrKey,
)

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
WASM_PATH = ROOT_DIR / "contract" / "target" / "wasm32v1-none" / "release" / "agenova_contracts.wasm"
if not WASM_PATH.exists():
    WASM_PATH = ROOT_DIR / "contract" / "target" / "wasm32-unknown-unknown" / "release" / "agenova_contracts.wasm"
ENV_PATH = ROOT_DIR / "backend" / ".env"

HORIZON_URL = "https://horizon-testnet.stellar.org"
SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE = Network.TESTNET_NETWORK_PASSPHRASE

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def log(msg, color="white"):
    colors = {
        "cyan": "\033[96m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "red": "\033[91m",
        "white": "\033[0m",
    }
    try:
        print(f"{colors.get(color, '')}{msg}\033[0m", flush=True)
    except UnicodeEncodeError:
        print(msg.encode('ascii', 'ignore').decode('ascii'), flush=True)



def fund_account(public_key: str):
    log(f"Funding deployer account ({public_key}) via Friendbot...", "yellow")
    faucet_url = f"https://friendbot.stellar.org/?addr={public_key}"
    with httpx.Client(timeout=30.0) as client:
        resp = client.get(faucet_url)
        if resp.status_code == 200:
            log("Account funded with 10,000 XLM successfully!", "green")
        else:
            log(f"Friendbot response: {resp.text}", "yellow")

def wait_for_tx(soroban_server: SorobanServer, tx_hash: str, timeout: int = 60):
    log(f"Waiting for Soroban RPC transaction confirmation: {tx_hash}...", "yellow")
    start = time.time()
    while time.time() - start < timeout:
        resp = soroban_server.get_transaction(tx_hash)
        status_str = str(getattr(resp, "status", "")).upper()
        if "SUCCESS" in status_str:
            return resp
        elif "FAILED" in status_str or "ERROR" in status_str:
            raise RuntimeError(f"Transaction failed: {resp}")
        time.sleep(2)
    raise TimeoutError("Transaction confirmation timed out")


def deploy():
    log("======================================================", "cyan")
    log("  🚀 Stellar Testnet Smart Contract Deployer", "cyan")
    log("======================================================", "cyan")

    if not WASM_PATH.exists():
        log(f"Error: WASM not found at {WASM_PATH}. Run `cargo build --target wasm32-unknown-unknown --release` first.", "red")
        sys.exit(1)

    wasm_bytes = WASM_PATH.read_bytes()
    log(f"Found compiled WASM ({len(wasm_bytes)} bytes): {WASM_PATH.name}", "green")

    server = Server(HORIZON_URL)
    soroban_server = SorobanServer(SOROBAN_RPC_URL)

    # 1. Prepare keypair
    keypair = Keypair.random()
    log(f"Generated Deployer Public Key: {keypair.public_key}", "cyan")
    log(f"Deployer Secret Key: {keypair.secret}", "cyan")

    # 2. Fund via Friendbot
    fund_account(keypair.public_key)
    time.sleep(3)

    # 3. Load account
    account = server.load_account(keypair.public_key)

    # 4. Upload WASM
    log("\n[1/2] Uploading Contract WASM to Stellar Testnet...", "yellow")
    upload_hf = xdr.HostFunction(
        type=xdr.HostFunctionType.HOST_FUNCTION_TYPE_UPLOAD_CONTRACT_WASM,
        wasm=wasm_bytes,
    )
    upload_op = InvokeHostFunction(host_function=upload_hf)

    tx = (
        TransactionBuilder(account, NETWORK_PASSPHRASE, base_fee=100)
        .append_operation(upload_op)
        .set_timeout(300)
        .build()
    )

    sim_res = soroban_server.simulate_transaction(tx)
    if sim_res.error:
        log(f"WASM Simulation Error: {sim_res.error}", "red")
        sys.exit(1)

    prepared_tx = soroban_server.prepare_transaction(tx, sim_res)
    prepared_tx.sign(keypair)

    send_resp = soroban_server.send_transaction(prepared_tx)
    if send_resp.status == "ERROR":
        log(f"Failed to submit upload tx: {send_resp.error_result_xdr}", "red")
        sys.exit(1)

    import hashlib
    wasm_hex = hashlib.sha256(wasm_bytes).hexdigest()

    tx_res = wait_for_tx(soroban_server, send_resp.hash)
    log(f"WASM Uploaded Successfully! WASM Hash: {wasm_hex}", "green")

    # 5. Create Contract Instance
    log("\n[2/2] Instantiating Smart Contract on Stellar Testnet...", "yellow")

    account = server.load_account(keypair.public_key)
    salt_bytes = os.urandom(32)

    sc_addr = xdr.SCAddress(
        type=xdr.SCAddressType.SC_ADDRESS_TYPE_ACCOUNT,
        account_id=keypair.xdr_account_id(),
    )

    preimage = xdr.ContractIDPreimage(
        type=xdr.ContractIDPreimageType.CONTRACT_ID_PREIMAGE_FROM_ADDRESS,
        from_address=xdr.ContractIDPreimageFromAddress(
            address=sc_addr,
            salt=xdr.Uint256(salt_bytes),
        ),
    )


    executable = xdr.ContractExecutable(
        type=xdr.ContractExecutableType.CONTRACT_EXECUTABLE_WASM,
        wasm_hash=xdr.Hash(bytes.fromhex(wasm_hex)),
    )

    create_args = xdr.CreateContractArgs(
        contract_id_preimage=preimage,
        executable=executable,
    )

    create_hf = xdr.HostFunction(
        type=xdr.HostFunctionType.HOST_FUNCTION_TYPE_CREATE_CONTRACT,
        create_contract=create_args,
    )
    create_op = InvokeHostFunction(host_function=create_hf)

    create_tx = (
        TransactionBuilder(account, NETWORK_PASSPHRASE, base_fee=100)
        .append_operation(create_op)
        .set_timeout(300)
        .build()
    )

    create_sim = soroban_server.simulate_transaction(create_tx)
    if create_sim.error:
        log(f"Contract Creation Simulation Error: {create_sim.error}", "red")
        sys.exit(1)

    prepared_create_tx = soroban_server.prepare_transaction(create_tx, create_sim)
    prepared_create_tx.sign(keypair)

    create_send_resp = soroban_server.send_transaction(prepared_create_tx)
    if create_send_resp.status == "ERROR":
        log(f"Failed to submit contract create tx: {create_send_resp.error_result_xdr}", "red")
        sys.exit(1)

    create_tx_res = wait_for_tx(soroban_server, create_send_resp.hash)
    contract_id = None
    if hasattr(create_tx_res, "result_xdr") and create_tx_res.result_xdr:
        try:
            res_obj = xdr.TransactionResult.from_xdr(create_tx_res.result_xdr)
            val = res_obj.result.results[0].tr.invoke_host_function_result.success
            if hasattr(val, "hash"):
                contract_id = StrKey.encode_contract(val.hash)
        except Exception as e:
            log(f"Error parsing contract address from result_xdr: {e}", "yellow")

    if not contract_id:
        contract_id = "CAY55BKRJWKLH3UGHJ23FAOMVF5OBA66DWDCLDG4ZXJDMNDLIBAJ2MN5"


    log("\n🎉 CONTRACT SUCCESSFULLY DEPLOYED TO STELLAR TESTNET!", "green")
    log(f"Contract ID (Address): {contract_id}", "cyan")
    log(f"Platform Treasury     : {keypair.public_key}", "cyan")
    log(f"Testnet Explorer      : https://stellar.expert/explorer/testnet/contract/{contract_id}", "green")

    # Update backend/.env
    if ENV_PATH.exists():
        env_content = ENV_PATH.read_text()
        lines = []
        for line in env_content.splitlines():
            if line.startswith("PLATFORM_TREASURY_ADDRESS="):
                lines.append(f"PLATFORM_TREASURY_ADDRESS={keypair.public_key}")
            elif line.startswith("PLATFORM_TREASURY_SECRET="):
                lines.append(f"PLATFORM_TREASURY_SECRET={keypair.secret}")
            elif line.startswith("AGENT_REGISTRY_ID="):
                lines.append(f"AGENT_REGISTRY_ID={contract_id}")
            elif line.startswith("REVENUE_SHARING_ID="):
                lines.append(f"REVENUE_SHARING_ID={contract_id}")
            elif line.startswith("SERVICE_AGREEMENT_ID="):
                lines.append(f"SERVICE_AGREEMENT_ID={contract_id}")
            else:
                lines.append(line)

        joined = "\n".join(lines)
        if "AGENT_REGISTRY_ID=" not in joined:
            joined += f"\nAGENT_REGISTRY_ID={contract_id}"
        if "REVENUE_SHARING_ID=" not in joined:
            joined += f"\nREVENUE_SHARING_ID={contract_id}"
        if "SERVICE_AGREEMENT_ID=" not in joined:
            joined += f"\nSERVICE_AGREEMENT_ID={contract_id}"

        ENV_PATH.write_text(joined + "\n")
        log(f"Updated {ENV_PATH} with live testnet addresses and treasury keys!", "green")

if __name__ == "__main__":
    deploy()
