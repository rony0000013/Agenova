import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum

class IntegrationType(str, enum.Enum):
    GITHUB = "github"
    SLACK = "slack"
    NOTION = "notion"
    GMAIL = "gmail"
    GOOGLE_DRIVE = "google_drive"
    WEBHOOK = "webhook"

class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    type: Mapped[IntegrationType] = mapped_column(SAEnum(IntegrationType), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    config: Mapped[str | None] = mapped_column(Text, nullable=True)
    connected: Mapped[bool] = mapped_column(Boolean, default=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
