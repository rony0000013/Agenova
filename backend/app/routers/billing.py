from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("/subscription")
async def get_subscription(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result.scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=user.id, plan=SubscriptionPlan.FREE, status=SubscriptionStatus.ACTIVE)
        db.add(sub)
        await db.flush()
    return sub

@router.get("/plans")
async def get_plans():
    return [
        {"id": "free", "name": "Free", "price": 0, "features": ["10 requests/month", "Basic agents", "Community support"]},
        {"id": "starter", "name": "Starter", "price": 10, "features": ["100 requests/month", "All agents", "Priority support", "Analytics"]},
        {"id": "pro", "name": "Pro", "price": 50, "features": ["1000 requests/month", "Premium agents", "Priority support", "Advanced analytics", "API access"]},
        {"id": "enterprise", "name": "Enterprise", "price": -1, "features": ["Unlimited", "Dedicated agents", "24/7 support", "Custom", "On-premise"]},
    ]

@router.post("/subscribe")
async def subscribe(plan_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result.scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=user.id, plan=plan_id, status=SubscriptionStatus.ACTIVE)
        db.add(sub)
    else:
        sub.plan = plan_id
        sub.status = SubscriptionStatus.ACTIVE
    await db.flush()
    return sub

@router.post("/cancel")
async def cancel_subscription(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result.scalar_one_or_none()
    if sub:
        sub.cancel_at_period_end = True
        await db.flush()
    return {"message": "Subscription will be canceled at period end"}
