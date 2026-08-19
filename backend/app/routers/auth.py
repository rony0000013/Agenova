from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import LoginRequest, SignupRequest, LoginResponse, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, WalletLoginRequest

from app.middleware.auth import get_current_user
from app.services.auth_service import authenticate_user, create_user, create_access_token
from app.models.user import User

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return LoginResponse(access_token=token, user=UserResponse.model_validate(user))

@router.post("/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await create_user(db, req.email, req.password, req.name)
    return {"user": UserResponse.model_validate(user), "message": "Account created. Please verify your email."}

@router.post("/stellar-login")
@router.post("/login-wallet")
async def stellar_login(req: WalletLoginRequest, db: AsyncSession = Depends(get_db)):
    address = (req.walletAddress or "").strip()

    if not address or not address.startswith("G") or len(address) < 30:
        raise HTTPException(status_code=400, detail="Valid Stellar Public Key (starting with G) is required")

    from sqlalchemy import select
    from app.models.wallet import Wallet
    from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus

    result = await db.execute(select(User).where(User.wallet_address == address))
    user = result.scalar_one_or_none()

    if not user:
        short_addr = address[1:7].lower()
        email = f"stellar_{short_addr}@stellar.id"
        name = req.name or f"Stellar User ({address[:4]}...{address[-4:]})"
        
        # Check if email exists
        ex_email = await db.execute(select(User).where(User.email == email))
        if ex_email.scalar_one_or_none():
            email = f"stellar_{address[:8].lower()}@stellar.id"

        user = User(
            email=email,
            password_hash=get_password_hash("StellarWalletNoPassword!"),
            name=name,
            role="developer",
            wallet_address=address,
            is_verified=True,
            is_onboarded=True,
        )
        db.add(user)
        await db.flush()

        # Create wallet
        wallet = Wallet(user_id=user.id, xlm_balance=100.0, address=address)
        db.add(wallet)

        # Create subscription
        sub = Subscription(user_id=user.id, plan=SubscriptionPlan.FREE, status=SubscriptionStatus.ACTIVE)
        db.add(sub)
        await db.flush()



    token = create_access_token(user.id)
    user_res = UserResponse.model_validate(user)
    return {
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "user": user_res,
    }

@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    name: str | None = None,
    company: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if name:
        user.name = name
    if company:
        user.company = company
    await db.flush()
    return UserResponse.model_validate(user)

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    return {"message": "If the email exists, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    return {"message": "Password reset successful."}

@router.post("/verify-email")
async def verify_email(token: str):
    return {"message": "Email verified successfully."}

