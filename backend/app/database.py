import logging
import os
import socket
import tempfile
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from app.config import settings

logger = logging.getLogger("agenova.database")

class Base(DeclarativeBase):
    pass

def _get_sqlite_url() -> str:
    # On Vercel / AWS Lambda (/var/task), the root directory is strictly read-only.
    # Writable SQLite files must be placed in the temporary directory (/tmp).
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.path.exists("/tmp"):
        tmp_path = Path(tempfile.gettempdir()) / "agenova.db"
        return f"sqlite+aiosqlite:///{tmp_path.as_posix()}"
    return "sqlite+aiosqlite:///./agenova.db"

def _can_connect_local_pg(db_url: str) -> bool:
    if "localhost" not in db_url and "127.0.0.1" not in db_url:
        return True  # Remote cloud Postgres (e.g. Neon, Supabase)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        res = s.connect_ex(('127.0.0.1', 5432))
        s.close()
        return res == 0
    except Exception:
        return False

def _get_engine():
    db_url = settings.database_url
    if "postgresql" in db_url and not _can_connect_local_pg(db_url):
        sqlite_url = _get_sqlite_url()
        logger.info(f"Local PostgreSQL not detected. Using SQLite database ({sqlite_url}).")
        return create_async_engine(sqlite_url, echo=settings.debug)
    try:
        return create_async_engine(db_url, echo=settings.debug)
    except Exception:
        sqlite_url = _get_sqlite_url()
        return create_async_engine(sqlite_url, echo=settings.debug)

engine = _get_engine()
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    global engine, async_session
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        sqlite_url = _get_sqlite_url()
        logger.warning(f"DB connection to {settings.database_url} failed ({e}). Switching to SQLite database ({sqlite_url}).")
        try:
            engine = create_async_engine(sqlite_url, echo=settings.debug)
            async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except Exception as e2:
            logger.warning(f"File SQLite failed ({e2}). Switching to in-memory SQLite fallback.")
            engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=settings.debug)
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
