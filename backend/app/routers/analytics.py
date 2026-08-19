from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.agent import Agent
from app.models.transaction import Transaction
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("/dashboard")
async def dashboard_analytics(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    total_requests = await db.scalar(select(func.count(Transaction.id)).where(Transaction.user_id == user.id)) or 0
    total_spent = await db.scalar(select(func.sum(Transaction.amount)).where(Transaction.user_id == user.id, Transaction.type == "payment")) or 0
    agents_used = await db.scalar(select(func.count(func.distinct(Transaction.agent_id))).where(Transaction.user_id == user.id)) or 0
    return {"total_requests": total_requests, "total_spent": float(total_spent), "agents_used": agents_used}

@router.get("/developer")
async def developer_analytics(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.developer_id == user.id))
    agents = result.scalars().all()
    total_requests = sum(a.total_requests for a in agents)
    total_revenue = sum(a.total_revenue for a in agents)
    return {"total_agents": len(agents), "total_requests": total_requests, "total_revenue": total_revenue}

@router.get("/admin")
async def admin_analytics(db: AsyncSession = Depends(get_db)):
    total_users = await db.scalar(select(func.count(User.id))) or 0
    total_agents = await db.scalar(select(func.count(Agent.id))) or 0
    total_transactions = await db.scalar(select(func.count(Transaction.id))) or 0
    total_revenue = await db.scalar(select(func.sum(Transaction.amount))) or 0
    return {"total_users": total_users, "total_agents": total_agents, "total_transactions": total_transactions, "total_revenue": float(total_revenue)}
