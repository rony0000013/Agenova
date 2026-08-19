import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum as SAEnum, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum

class WalletProvider(str, enum.Enum):
    FREIGHTER = "freighter"
    X402 = "x402"

class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    provider: Mapped[WalletProvider] = mapped_column(SAEnum(WalletProvider), default=WalletProvider.FREIGHTER)
    xlm_balance: Mapped[float] = mapped_column(Float, default=0.0)
    usdc_balance: Mapped[float] = mapped_column(Float, default=0.0)
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
