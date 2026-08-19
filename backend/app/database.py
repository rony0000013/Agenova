import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.config import settings

logger = logging.getLogger("agenova.database")

class Base(DeclarativeBase):
    pass

import socket

def _can_connect_pg(db_url: str) -> bool:
    try:
        if "postgresql" not in db_url:
            return True
        # Extract host and port
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        # Standard check on port 5432 or custom port
        res = s.connect_ex(('127.0.0.1', 5432))
        s.close()
        return res == 0
    except Exception:
        return False

def _get_engine():
    db_url = settings.database_url
    if "postgresql" in db_url and not _can_connect_pg(db_url):
        logger.info("Local PostgreSQL not detected on port 5432. Using SQLite database (sqlite+aiosqlite:///./agenova.db).")
        return create_async_engine("sqlite+aiosqlite:///./agenova.db", echo=settings.debug)
    try:
        return create_async_engine(db_url, echo=settings.debug)
    except Exception:
        return create_async_engine("sqlite+aiosqlite:///./agenova.db", echo=settings.debug)


engine = _get_engine()
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    global engine, async_session
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.warning(f"DB connection to {settings.database_url} failed ({e}). Switching to local SQLite database.")
        engine = create_async_engine("sqlite+aiosqlite:///./agenova.db", echo=settings.debug)
        async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

