from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.agent import Agent
from app.middleware.auth import get_admin_user

router = APIRouter()

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).order_by(User.created_at.desc())
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    return {
        "data": [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "is_verified": u.is_verified, "created_at": u.created_at} for u in users],
        "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit},
    }

@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "User not found"}
    user.role = role
    await db.flush()
    return {"message": "User role updated"}

@router.get("/agents")
async def list_all_agents(admin: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).order_by(Agent.created_at.desc()))
    return result.scalars().all()

@router.put("/agents/{agent_id}/toggle")
async def toggle_agent(agent_id: str, admin: User = Depends(get_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        return {"message": "Agent not found"}
    agent.is_active = not agent.is_active
    await db.flush()
    return {"message": f"Agent {'activated' if agent.is_active else 'deactivated'}"}
