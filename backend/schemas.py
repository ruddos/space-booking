from datetime import datetime, time
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr
from models import UserRole, BookingStatus

class AmenityBase(BaseModel):
    name: str

class AmenityCreate(AmenityBase):
    pass

class AmenityResponse(AmenityBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ScheduleBase(BaseModel):
    day_of_week: int
    open_time: time
    close_time: time

class ScheduleResponse(ScheduleBase):
    id: int
    room_id: int
    model_config = ConfigDict(from_attributes=True)

class SlotResponse(BaseModel):
    time: str
    is_available: bool

class AvailableSlotsResponse(BaseModel):
    room_id: int
    date: str
    open_time: str
    close_time: str
    slots: List[SlotResponse]

class RoomBase(BaseModel):
    name: str
    category: Optional[str] = "Фотостудия"
    description: Optional[str] = None
    price_per_hour: int
    capacity: int
    area: Optional[int] = 80
    metro: Optional[str] = "м. Белорусская"
    address: Optional[str] = "Москва, ул. Лесная, 7"
    rating: Optional[float] = 4.9
    reviews_count: Optional[int] = 128
    image_url: Optional[str] = None

class RoomCreate(RoomBase):
    amenities: List[str] = []

class RoomResponse(RoomBase):
    id: int
    is_active: bool
    amenities: List[AmenityResponse] = []
    today_available_slots: List[str] = []
    model_config = ConfigDict(from_attributes=True)

class RoomDetailResponse(RoomResponse):
    schedules: List[ScheduleResponse] = []

class BookingCreate(BaseModel):
    room_id: int
    start_time: datetime
    end_time: datetime
    additional_services: List[str] = []
    comment: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    booking_number: Optional[str] = None
    user_id: int
    room_id: int
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    total_price: int
    additional_services: Optional[str] = None
    comment: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    created_at: datetime
    room: Optional[RoomResponse] = None
    model_config = ConfigDict(from_attributes=True)

class BookingStatusUpdate(BaseModel):
    status: BookingStatus

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
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ReviewResponse(BaseModel):
    id: int
    room_id: int
    author_name: str
    rating: int
    text: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FavoriteResponse(BaseModel):
    id: int
    room_id: int
    room: Optional[RoomResponse] = None
    model_config = ConfigDict(from_attributes=True)
