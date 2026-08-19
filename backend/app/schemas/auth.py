from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    wallet_address: str | None
    is_verified: bool
    is_onboarded: bool

    class Config:
        from_attributes = True

class WalletLoginRequest(BaseModel):
    walletAddress: str
    name: str | None = None
    role: str | None = "developer"

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class VerifyEmailRequest(BaseModel):
    token: str

