from fastapi import FastAPI, Depends, HTTPException, status
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

from database import init_db, async_session_maker, engine
from models import Room, RoomAmenity
from schemas import RoomCreate, RoomResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="SPACE Booking API", lifespan=lifespan)

async def get_db():
    async with async_session_maker() as session:
        yield session

@app.get("/api/check-db")
async def check_db():
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        )
        tables = [row[0] for row in result.fetchall()]
        return {"status": "connected", "tables": tables}

@app.get("/api/rooms", response_model=list[RoomResponse])
async def get_rooms(db: AsyncSession = Depends(get_db)):
    query = select(Room).options(selectinload(Room.amenities)).where(Room.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()

@app.post("/api/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
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