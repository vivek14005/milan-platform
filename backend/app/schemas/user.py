from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# =========================================================
# PROFILE UPDATE
# =========================================================

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    area: Optional[str] = None
    pincode: Optional[str] = None