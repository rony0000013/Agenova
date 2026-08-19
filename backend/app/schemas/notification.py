from pydantic import BaseModel
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str | None
    read: bool
    link: str | None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationPreferences(BaseModel):
    payments: bool = True
    agent_executions: bool = True
    revenue_updates: bool = True
    system_announcements: bool = True
    new_agents: bool = False
