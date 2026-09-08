from pydantic import BaseModel
from typing import Optional


class VendorCreate(BaseModel):
    business_name: str
    category: str
    phone: str

    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    area: Optional[str] = None
    pincode: Optional[str] = None
    description: Optional[str] = None


class VendorUpdate(BaseModel):
    business_name: Optional[str] = None
    category: Optional[str] = None
    phone: Optional[str] = None

    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    area: Optional[str] = None
    pincode: Optional[str] = None
    description: Optional[str] = None