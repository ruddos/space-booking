import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from models import Base

# порт 5433, чтобы не конфликтовать с другими postgres на 5432
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgrespassword@127.0.0.1:5433/space_db",
)

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        # Создаем все новые таблицы (включая favorites и reviews)
        await conn.run_sync(Base.metadata.create_all)

        # Безопасная миграция колонок для существующих таблиц
        migrations = [
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Фотостудия';",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS metro VARCHAR(100) DEFAULT 'м. Белорусская';",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS address VARCHAR(200) DEFAULT 'Москва, ул. Лесная, 7';",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS area INTEGER DEFAULT 80;",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 4.9;",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 128;",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS studio_id INTEGER;",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code_id INTEGER;",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_number VARCHAR(20);",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_services TEXT;",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS comment TEXT;",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);"
        ]
        for mig in migrations:
            await conn.execute(text(mig))

async def get_db():
    async with async_session_maker() as session:
        yield session
