import logging
import httpx
from typing import Optional
from app.config import settings

logger = logging.getLogger("agenova.payments")

PLATFORM_FEE_PERCENT = 20
DEVELOPER_PERCENT = 80

def calculate_revenue_split(amount: float) -> dict:
    """Calculate developer (80%) and platform (20%) revenue shares."""
    developer_share = round(amount * DEVELOPER_PERCENT / 100, 7)
    platform_share = round(amount * PLATFORM_FEE_PERCENT / 100, 7)
    return {
        "developer_share": developer_share,
        "platform_share": platform_share,
        "developer_percent": DEVELOPER_PERCENT,
        "platform_percent": PLATFORM_FEE_PERCENT,
    }

async def fetch_testnet_account_balance(account_address: str) -> float:
    """
    Fetch native XLM balance for a Stellar address directly from Horizon Testnet.
    Returns 0.0 if the account is unfunded or not found.
    """
    if not account_address or len(account_address) < 20:
        return 0.0
    url = f"{settings.stellar_horizon_url}/accounts/{account_address}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 404:
                return 0.0
            resp.raise_for_status()
            data = resp.json()
            for b in data.get("balances", []):
                if b.get("asset_type") == "native":
                    return float(b.get("balance", "0"))
    except Exception as e:
        logger.warning(f"Failed to fetch Stellar balance for {account_address}: {e}")
    return 0.0

async def request_testnet_faucet(account_address: str) -> dict:
    """
    Fund a Stellar Testnet account with 10,000 test XLM via Stellar Friendbot.
    """
    faucet_url = f"https://friendbot.stellar.org/?addr={account_address}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(faucet_url)
        resp.raise_for_status()
        return resp.json()

async def verify_horizon_transaction(tx_hash: str) -> dict:
    """
    Verify on-chain transaction status and details from Horizon Testnet.
    """
    url = f"{settings.stellar_horizon_url}/transactions/{tx_hash}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()

async def execute_stellar_payment(
    amount: float,
    destination_address: str,
    source_secret: Optional[str] = None,
    memo_text: str = "Agenova Payment",
) -> str:
    """
    Build, sign, and submit a live Stellar payment transaction on Testnet.
    If source_secret is not configured, generates a simulated transaction hash.
    """
    secret = source_secret or settings.platform_treasury_secret
    if not secret:
        import hashlib, time
        mock_hash = hashlib.sha256(f"{amount}-{destination_address}-{time.time()}".encode()).hexdigest()
        return mock_hash

    try:
        from stellar_sdk import Server, Keypair, TransactionBuilder, Network, Payment, Asset
        server = Server(horizon_url=settings.stellar_horizon_url)
        source_keypair = Keypair.from_secret(secret)
        source_account = server.load_account(account_id=source_keypair.public_key)

        tx = (
            TransactionBuilder(
                source_account=source_account,
                network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
                base_fee=100,
            )
            .append_payment_op(
                destination=destination_address,
                amount=str(round(amount, 7)),
                asset=Asset.native(),
            )
            .add_text_memo(memo_text[:28])
            .set_timeout(30)
            .build()
        )

        tx.sign(source_keypair)
        response = server.submit_transaction(tx)
        return response.get("hash", "")
    except Exception as e:
        logger.error(f"Error submitting Stellar transaction: {e}")
        raise

async def execute_payment_split(
    amount: float,
    developer_address: str,
    platform_address: str,
    agent_name: str,
) -> dict:
    """
    Execute 80/20 payment split between Developer and Platform Treasury.
    """
    split = calculate_revenue_split(amount)
    dev_tx = ""
    if developer_address and developer_address.startswith("G"):
        try:
            dev_tx = await execute_stellar_payment(
                amount=split["developer_share"],
                destination_address=developer_address,
                memo_text=f"Dev: {agent_name[:20]}",
            )
        except Exception as e:
            logger.warning(f"Could not submit live on-chain dev payout: {e}")
    return {
        **split,
        "developer_tx": dev_tx,
    }
