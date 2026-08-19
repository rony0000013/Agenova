from pydantic_settings import BaseSettings
from os import getenv

class Settings(BaseSettings):
    app_name: str = "Agenova API"
    debug: bool = True

    database_url: str = getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/agenova")
    database_url_sync: str = getenv("DATABASE_URL_SYNC", "postgresql://postgres:postgres@localhost:5432/agenova")

    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    stellar_network: str = "testnet"
    stellar_horizon_url: str = "https://horizon-testnet.stellar.org"
    stellar_rpc_url: str = "https://soroban-testnet.stellar.org"
    platform_treasury_address: str = ""
    platform_treasury_secret: str = ""

    cors_origins: str = "http://localhost:3000"

    openai_api_key: str = getenv("OPENAI_API_KEY", "")
    openai_model: str = "gpt-4o-mini"

    service_agreement_id: str = ""
    revenue_sharing_id: str = ""
    agent_registry_id: str = ""

    class Config:
        env_file = ".env"

    def model_post_init(self, __context):
        if not self.jwt_secret:
            raise ValueError("JWT_SECRET environment variable is required")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")

settings = Settings()
