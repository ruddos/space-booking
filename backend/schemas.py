from datetime import datetime, time
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr
from models import UserRole, BookingStatus

# --- Amenity Schemas ---
class AmenityBase(BaseModel):
    name: str

class AmenityCreate(AmenityBase):
    pass

class AmenityResponse(AmenityBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Schedule Schemas ---
class ScheduleBase(BaseModel):
    day_of_week: int
    open_time: time
    close_time: time

class ScheduleResponse(ScheduleBase):
    id: int
    room_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Review Schemas ---
class ReviewResponse(BaseModel):
    id: int
    room_id: int
    author_name: str
    rating: int
    text: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Slot Schemas ---
class SlotResponse(BaseModel):
    time: str
    is_available: bool

class AvailableSlotsResponse(BaseModel):
    room_id: int
    date: str
    open_time: str
    close_time: str
    slots: List[SlotResponse]

# --- Room Schemas ---
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
    reviews: List[ReviewResponse] = []

# --- Booking Schemas ---
class BookingCreate(BaseModel):
    room_id: int
    start_time: datetime
    end_time: datetime
    additional_services: List[str] = []
    service_ids: List[int] = []
    promo_code: Optional[str] = None
    comment: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    booking_number: Optional[str] = None
    user_id: int
    room_id: int
    promo_code_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    total_price: int
    discount_amount: int = 0
    additional_services: Optional[str] = None
    comment: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    created_at: datetime
    room: Optional[RoomResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class BookingStatusUpdate(BaseModel):
    status: BookingStatus

# --- Service & Promo & Payment Schemas ---
class ServiceResponse(BaseModel):
    id: int
    name: str
    category: str
    price: int
    is_per_hour: bool
    description: Optional[str] = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class PromoValidateRequest(BaseModel):
    code: str
    total_amount: int

class PromoValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_percent: int
    discount_amount: int
    final_total: int
    message: str

class PriceCalculationRequest(BaseModel):
    room_id: int
    start_time: datetime
    end_time: datetime
    service_ids: List[int] = []
    promo_code: Optional[str] = None

class PriceCalculationResponse(BaseModel):
    duration_hours: int
    base_price_per_hour: int
    effective_hourly_rate: int
    is_weekend: bool
    duration_discount_percent: int
    duration_discount_amount: int
    hall_subtotal: int
    services_subtotal: int
    promo_discount_amount: int
    final_total: int

class PaymentResponse(BaseModel):
    id: int
    payment_number: str
    booking_id: int
    amount: int
    status: str
    payment_method: str
    transaction_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BookingStatusLogResponse(BaseModel):
    id: int
    booking_id: int
    old_status: Optional[str] = None
    new_status: str
    comment: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Favorite Schemas ---
class FavoriteResponse(BaseModel):
    id: int
    room_id: int
    room: Optional[RoomResponse] = None
    model_config = ConfigDict(from_attributes=True)

# --- Blog Schemas (Экран 08) ---
class BlogPostResponse(BaseModel):
    id: int
    title: str
    category: str
    read_time: str
    description: str
    image_url: Optional[str] = None
    is_featured: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Contact & Newsletter Schemas (Экран 08 & 09) ---
class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    topic: str = "Вопрос по бронированию"
    message: str

class NewsletterSubscribe(BaseModel):
    email: EmailStr

# --- User & Auth Schemas ---
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
