from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

from database import init_db, get_db, engine
from models import Room, RoomAmenity, User, UserRole
from schemas import (
    RoomCreate, RoomResponse,
    UserCreate, UserLogin, UserResponse, TokenResponse
)
from auth import (
    hash_password, verify_password,
    create_access_token, get_current_user
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="SPACE Booking API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/check-db", tags=["System"])
async def check_db():
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        )
        tables = [row[0] for row in result.fetchall()]
        return {"status": "connected", "tables": tables}

@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже зарегистрирован"
        )

    new_user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=UserRole.CLIENT
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(
        data={"sub": str(new_user.id), "email": new_user.email, "role": new_user.role.value}
    )
    return TokenResponse(access_token=token, token_type="bearer", user=new_user)

@app.post("/api/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == login_data.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user)

@app.get("/api/auth/me", response_model=UserResponse, tags=["Auth"])
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/api/rooms", response_model=list[RoomResponse], tags=["Rooms"])
async def get_rooms(db: AsyncSession = Depends(get_db)):
    query = select(Room).options(selectinload(Room.amenities)).where(Room.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()

@app.post("/api/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED, tags=["Rooms"])
async def create_room(room_data: RoomCreate, db: AsyncSession = Depends(get_db)):
    new_room = Room(
        name=room_data.name,
        description=room_data.description,
        price_per_hour=room_data.price_per_hour,
        capacity=room_data.capacity,
        image_url=room_data.image_url
    )
    db.add(new_room)
    await db.flush()

    for item in room_data.amenities:
        amenity = RoomAmenity(room_id=new_room.id, name=item)
        db.add(amenity)

    await db.commit()
    
    query = select(Room).options(selectinload(Room.amenities)).where(Room.id == new_room.id)
    res = await db.execute(query)
    return res.scalar_one()
