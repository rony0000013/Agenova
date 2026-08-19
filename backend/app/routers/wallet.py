from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.wallet import Wallet
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.middleware.auth import get_current_user
from app.schemas.wallet import WalletConnectRequest, WalletResponse
from app.services.payment_service import fetch_testnet_account_balance, request_testnet_faucet

router = APIRouter()

@router.post("/connect", response_model=WalletResponse)
async def connect_wallet(
    req: WalletConnectRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = result.scalar_one_or_none()

    # Try fetching real on-chain balance from Horizon
    on_chain_balance = await fetch_testnet_account_balance(req.address)

    if wallet:
        wallet.address = req.address
        wallet.is_connected = True
        if on_chain_balance > 0:
            wallet.xlm_balance = on_chain_balance
    else:
        initial_balance = on_chain_balance if on_chain_balance > 0 else 100.0
        wallet = Wallet(
            user_id=user.id,
            address=req.address,
            xlm_balance=initial_balance,
            usdc_balance=0.0,
            is_connected=True,
        )
        db.add(wallet)

    user.wallet_address = req.address
    await db.flush()
    return WalletResponse.model_validate(wallet)

@router.post("/disconnect")
async def disconnect_wallet(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = result.scalar_one_or_none()
    if wallet:
        wallet.is_connected = False
        user.wallet_address = None
        await db.flush()
    return {"message": "Wallet disconnected"}

@router.get("", response_model=WalletResponse)
@router.get("/balance", response_model=WalletResponse)
async def get_wallet_or_balance(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(
            user_id=user.id,
            address=user.wallet_address or "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
            xlm_balance=100.0,
            usdc_balance=0.0,
            is_connected=bool(user.wallet_address),
        )
        db.add(wallet)
        await db.flush()
    elif wallet.address and wallet.address.startswith("G"):
        # Auto-sync live testnet balance if available
        live_bal = await fetch_testnet_account_balance(wallet.address)
        if live_bal > 0:
            wallet.xlm_balance = live_bal
            await db.flush()

    return WalletResponse.model_validate(wallet)

@router.post("/faucet")
@router.post("/topup")
async def wallet_faucet(
    amount: float = Query(50.0, ge=1.0, le=1000.0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        wallet = Wallet(
            user_id=user.id,
            address=user.wallet_address or "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
            xlm_balance=100.0,
            usdc_balance=0.0,
            is_connected=bool(user.wallet_address),
        )
        db.add(wallet)

    faucet_msg = f"Successfully received {amount} XLM"

    # If valid Stellar testnet address, also trigger Friendbot faucet
    if wallet.address and wallet.address.startswith("G") and len(wallet.address) == 56:
        try:
            await request_testnet_faucet(wallet.address)
            faucet_msg = f"Successfully funded {wallet.address} with 10,000 XLM via Stellar Friendbot"
            live_bal = await fetch_testnet_account_balance(wallet.address)
            if live_bal > 0:
                wallet.xlm_balance = live_bal
            else:
                wallet.xlm_balance += amount
        except Exception:
            wallet.xlm_balance += amount
    else:
        wallet.xlm_balance += amount

    tx = Transaction(
        type=TransactionType.DEPOSIT,
        amount=amount,
        asset="XLM",
        user_id=user.id,
        status=TransactionStatus.COMPLETED,
        description=f"Stellar Testnet Friendbot Faucet (+{amount} XLM)",
    )
    db.add(tx)
    await db.flush()
    return {
        "message": faucet_msg,
        "balance": wallet.xlm_balance,
        "xlm_balance": wallet.xlm_balance,
    }

@router.get("/transactions")
async def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Transaction).where(Transaction.user_id == user.id).order_by(Transaction.created_at.desc())
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    txs = result.scalars().all()
    return {
        "data": txs,
        "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit},
    }
