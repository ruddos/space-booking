from datetime import datetime, time
import enum
from sqlalchemy import (
    String, Integer, Text, ForeignKey, 
    DateTime, Time, Enum, Boolean, Float, UniqueConstraint
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class UserRole(str, enum.Enum):
    CLIENT = "client"
    ADMIN = "admin"

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"

class PaymentMethod(str, enum.Enum):
    CARD = "card"
    SBP = "sbp"
    INVOICE = "invoice"
    CASH = "cash"

class ServiceCategory(str, enum.Enum):
    EQUIPMENT = "equipment"
    ASSISTANT = "assistant"
    MAKEUP = "makeup"
    EXTRA = "extra"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CLIENT, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="user")
    favorites: Mapped[list["Favorite"]] = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

# 1. Фотостудия / Пространство (1 студия -> N залов)
class Studio(Base):
    __tablename__ = "studios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    city: Mapped[str] = mapped_column(String(50), default="Москва", nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    metro: Mapped[str] = mapped_column(String(100), nullable=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=True)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    rooms: Mapped[list["Room"]] = relationship("Room", back_populates="studio")

class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    studio_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("studios.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=True, default="Фотостудия")
    description: Mapped[str] = mapped_column(Text, nullable=True)
    price_per_hour: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    area: Mapped[int] = mapped_column(Integer, nullable=True, default=80)
    metro: Mapped[str] = mapped_column(String(100), nullable=True, default="м. Белорусская")
    address: Mapped[str] = mapped_column(String(200), nullable=True)
    rating: Mapped[float] = mapped_column(Float, nullable=True, default=4.9)
    reviews_count: Mapped[int] = mapped_column(Integer, nullable=True, default=128)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    studio: Mapped["Studio | None"] = relationship("Studio", back_populates="rooms")
    amenities: Mapped[list["RoomAmenity"]] = relationship("RoomAmenity", back_populates="room", cascade="all, delete-orphan")
    schedules: Mapped[list["Schedule"]] = relationship("Schedule", back_populates="room", cascade="all, delete-orphan")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="room")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="room", cascade="all, delete-orphan")
    favorites: Mapped[list["Favorite"]] = relationship("Favorite", back_populates="room", cascade="all, delete-orphan")

class RoomAmenity(Base):
    __tablename__ = "room_amenities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    room: Mapped["Room"] = relationship("Room", back_populates="amenities")

class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    open_time: Mapped[time] = mapped_column(Time, nullable=False)
    close_time: Mapped[time] = mapped_column(Time, nullable=False)

    room: Mapped["Room"] = relationship("Room", back_populates="schedules")

# 2. Дополнительные платные услуги / Оборудование
class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[ServiceCategory] = mapped_column(Enum(ServiceCategory), default=ServiceCategory.EQUIPMENT, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    is_per_hour: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    booking_services: Mapped[list["BookingService"]] = relationship("BookingService", back_populates="service")

# 3. Промокоды и скидки
class PromoCode(Base):
    __tablename__ = "promo_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    discount_percent: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    max_discount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_uses: Mapped[int] = mapped_column(Integer, default=100)
    current_uses: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="promo_code")

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    booking_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    promo_code_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("promo_codes.id", ondelete="SET NULL"), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False)
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_amount: Mapped[int] = mapped_column(Integer, default=0)
    additional_services: Mapped[str] = mapped_column(Text, nullable=True)
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    contact_name: Mapped[str] = mapped_column(String(100), nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="bookings")
    room: Mapped["Room"] = relationship("Room", back_populates="bookings")
    promo_code: Mapped["PromoCode | None"] = relationship("PromoCode", back_populates="bookings")
    services: Mapped[list["BookingService"]] = relationship("BookingService", back_populates="booking", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    status_logs: Mapped[list["BookingStatusLog"]] = relationship("BookingStatusLog", back_populates="booking", cascade="all, delete-orphan")

# 4. Связующая таблица брони и платных услуг (3НФ)
class BookingService(Base):
    __tablename__ = "booking_services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    service_id: Mapped[int] = mapped_column(Integer, ForeignKey("services.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    price_at_booking: Mapped[int] = mapped_column(Integer, nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="services")
    service: Mapped["Service"] = relationship("Service", back_populates="booking_services")

# 5. Платежи и транзакции
class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    payment_number: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), default=PaymentMethod.CARD, nullable=False)
    transaction_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="payments")

# 6. Журнал аудита смены статусов бронирования
class BookingStatusLog(Base):
    __tablename__ = "booking_status_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    old_status: Mapped[str] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by_user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    comment: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="status_logs")

# 7. Уведомления пользователей
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(30), default="info")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="notifications")

class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, default=5)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    room: Mapped["Room"] = relationship("Room", back_populates="reviews")

class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "room_id", name="uq_user_room_favorite"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="favorites")
    room: Mapped["Room"] = relationship("Room", back_populates="favorites")

class BlogPost(Base):
    __tablename__ = "blog_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    read_time: Mapped[str] = mapped_column(String(30), default="5 мин")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    topic: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
