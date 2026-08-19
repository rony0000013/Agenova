from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

class AgentCreate(BaseModel):
    name: str
    description: str
    category: str
    model: str
    prompt: str
    price_per_request: float
    tags: Optional[list[str]] = None

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    model: Optional[str] = None
    prompt: Optional[str] = None
    price_per_request: Optional[float] = None
    status: Optional[str] = None

class AgentResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    model: str
    price_per_request: float
    status: str
    rating: float
    total_requests: int
    total_revenue: float
    tags: list[str] | None = None
    developer_id: str
    created_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v):
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        return v or []

    class Config:
        from_attributes = True


class AgentExecuteRequest(BaseModel):
    prompt: str
    tx_hash: Optional[str] = None

class AgentExecuteResponse(BaseModel):
    result: str
    transaction_id: str
    cost: float
