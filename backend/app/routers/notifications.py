from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("")
async def list_notifications(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50)
    )
    return result.scalars().all()

@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Notification).where(Notification.id == notification_id, Notification.user_id == user.id).values(read=True)
    )
    return {"message": "Marked as read"}

@router.put("/read-all")
async def mark_all_read(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(update(Notification).where(Notification.user_id == user.id).values(read=True))
    return {"message": "All notifications marked as read"}

@router.get("/preferences")
async def get_preferences():
    return {"payments": True, "agent_executions": True, "revenue_updates": True, "system_announcements": True, "new_agents": False}

@router.put("/preferences")
async def update_preferences(prefs: dict):
    return prefs
