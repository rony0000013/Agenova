from pydantic import BaseModel

class WalletConnectRequest(BaseModel):
    address: str

class WalletResponse(BaseModel):
    address: str
    xlm_balance: float
    usdc_balance: float
    is_connected: bool

    class Config:
        from_attributes = True
