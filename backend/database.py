from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from models import Base

DATABASE_URL = "postgresql+asyncpg://postgres:postgrespassword@127.0.0.1:5432/space_db"

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        migrations = [
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Фотостудия';",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS metro VARCHAR(100) DEFAULT 'м. Белорусская';",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS address VARCHAR(200) DEFAULT 'Москва, ул. Лесная, 7';",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS area INTEGER DEFAULT 80;",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 4.9;",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 128;"
        ]
        for mig in migrations:
            await conn.execute(text(mig))

async def get_db():
    async with async_session_maker() as session:
        yield session
