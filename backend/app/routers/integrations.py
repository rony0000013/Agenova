from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.integration import Integration, IntegrationType
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("")
async def list_integrations(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Integration).where(Integration.user_id == user.id))
    return result.scalars().all()

@router.post("/connect")
async def connect_integration(
    type: str,
    config: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Integration).where(Integration.user_id == user.id, Integration.type == type))
    integ = result.scalar_one_or_none()
    if not integ:
        integ = Integration(
            user_id=user.id,
            type=type,
            name=type.capitalize(),
            config=str(config),
            connected=True,
        )
        db.add(integ)
    else:
        integ.connected = True
        integ.config = str(config)
    await db.flush()
    return integ

@router.delete("/{integration_id}")
async def disconnect_integration(integration_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Integration).where(Integration.id == integration_id, Integration.user_id == user.id))
    integ = result.scalar_one_or_none()
    if not integ:
        raise HTTPException(status_code=404, detail="Integration not found")
    integ.connected = False
    await db.flush()
    return {"message": "Integration disconnected"}
