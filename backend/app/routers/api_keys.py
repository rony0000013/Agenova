import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.hash import sha256_crypt

from pydantic import BaseModel

from app.database import get_db
from app.models.api_key import APIKey
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter()

class APIKeyCreate(BaseModel):
    name: str

def generate_api_key() -> tuple[str, str, str]:
    key = f"ag_sk_{secrets.token_hex(24)}"
    prefix = key[:12]
    hashed = sha256_crypt.hash(key)
    return key, hashed, prefix

@router.get("")
async def list_api_keys(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIKey).where(APIKey.user_id == user.id))
    keys = result.scalars().all()
    return [{"id": k.id, "name": k.name, "key": k.key_prefix + "...", "created_at": k.created_at, "last_used": k.last_used_at, "active": k.active} for k in keys]

@router.post("")
async def create_api_key(req: APIKeyCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    full_key, hashed, prefix = generate_api_key()
    api_key = APIKey(user_id=user.id, name=req.name, key_hash=hashed, key_prefix=prefix)
    db.add(api_key)
    await db.flush()
    return {"id": api_key.id, "name": api_key.name, "key": full_key, "created_at": api_key.created_at, "active": True}

@router.delete("/{key_id}")
async def revoke_api_key(key_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(APIKey).where(APIKey.id == key_id, APIKey.user_id == user.id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    api_key.active = False
    await db.flush()
    return {"message": "API key revoked"}
