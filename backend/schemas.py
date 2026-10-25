from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from models import UserRole

class AmenityBase(BaseModel):
    name: str

class AmenityCreate(AmenityBase):
    pass

class AmenityResponse(AmenityBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_per_hour: int
    capacity: int
    image_url: Optional[str] = None

class RoomCreate(RoomBase):
    amenities: List[str] = []

class RoomResponse(RoomBase):
    id: int
    is_active: bool
    amenities: List[AmenityResponse] = []
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    created_at: str
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
