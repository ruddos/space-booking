from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import init_db, engine
from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="SPACE Booking API", lifespan=lifespan)

@app.get("/api/check-db")
async def check_db():
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        )
        tables = [row[0] for row in result.fetchall()]
        return {"status": "connected", "tables": tables}