import asyncio
from datetime import time
from sqlalchemy import select
from database import async_session_maker, init_db
from models import Room, RoomAmenity, Schedule, Review, BlogPost

ROOMS_DATA = [
    {
        "name": "Moody",
        "category": "Фотостудия",
        "metro": "м. Белорусская",
        "address": "Москва, ул. Лесная, 7",
        "area": 80,
        "rating": 4.9,
        "reviews_count": 128,
        "price_per_hour": 2500,
        "capacity": 10,
        "image_url": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
        "description": "Moody — студия в стиле индустриального лофта: белая циклорама, бетонный пол и тёмные стены, которые не дают паразитных отражений. Подходит для портретов, fashion- и предметной съёмки, а также для видео. Есть гримёрная зона с зеркалом и светом, кухня и зона отдыха для команды.",
        "amenities": [
            "Белая циклорама 6 × 4 м",
            "Импульсный свет Godox ×4",
            "Софтбоксы и октобоксы",
            "Фоны: 8 цветов",
            "Гримёрка с зеркалом",
            "Wi-Fi и розетки",
            "Кухня и чай/кофе",
            "Отопление и кондиционер"
        ],
        "reviews": [
            {
                "author_name": "Ольга П.",
                "rating": 5,
                "text": "Снимали лукбук — циклорама чистая, свет мощный, администратор помог выставить схему. Вернёмся."
            },
            {
                "author_name": "Илья Р.",
                "rating": 5,
                "text": "Удобно, что всё оплатил заранее на сайте и просто пришёл. Гримёрка тёплая, есть утюг и отпариватель."
            },
            {
                "author_name": "Ксения М.",
                "rating": 4,
                "text": "Отличная студия, но парковка во дворе быстро занимается — лучше приезжать на метро."
            }
        ]
    },
    {
        "name": "Loft North",
        "category": "Залы",
        "metro": "м. Савёловская",
        "address": "Москва, ул. Складочная, 1с1",
        "area": 95,
        "rating": 4.8,
        "reviews_count": 96,
        "price_per_hour": 3200,
        "capacity": 15,
        "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
        "description": "Интерьерный зал с панорамными окнами 4 м, фактурной кирпичной кладкой, винтажным кожаным диваном и теплым естественным светом. Отлично подходит для мастер-классов и съемок.",
        "amenities": [
            "Окна 4 м",
            "Гримёрка",
            "2x Постоянный свет Aputure 300d II",
            "Бумажные фоны",
            "Bluetooth-колонка Marshall"
        ],
        "reviews": [
            {
                "author_name": "Дмитрий С.",
                "rating": 5,
                "text": "Бронируем залы под мастер-классы каждый месяц. Удобно, что все брони и чеки лежат в одном кабинете."
            }
        ]
    },
    {
        "name": "White Box",
        "category": "Фотостудия",
        "metro": "м. Тульская",
        "address": "Москва, Варшавское шоссе, 9",
        "area": 65,
        "rating": 4.8,
        "reviews_count": 88,
        "price_per_hour": 2200,
        "capacity": 8,
        "image_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
        "description": "Идеально белое минималистичное пространство с угловой циклорамой и максимальным количеством рассеянного дневного света.",
        "amenities": [
            "Циклорама 6 м",
            "Гримёрка",
            "Импульсный свет Profoto",
            "Отражатели и флаги"
        ],
        "reviews": []
    },
    {
        "name": "Noir",
        "category": "Фотостудия",
        "metro": "м. Таганская",
        "address": "Москва, ул. Марксистская, 34",
        "area": 90,
        "rating": 4.6,
        "reviews_count": 51,
        "price_per_hour": 2900,
        "capacity": 8,
        "image_url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
        "description": "Темная студия с полной светоизоляцией, чёрным бархатным фоном, неоновой подсветкой и генератором дыма для атмосферных кадров.",
        "amenities": [
            "Циклорама",
            "Дым-машина",
            "RGB трубки Nanlite",
            "Лазерный проектор"
        ],
        "reviews": []
    },
    {
        "name": "Violet Hall",
        "category": "Залы",
        "metro": "м. Курская",
        "address": "Москва, ул. Нижняя Сыромятническая, 10",
        "area": 150,
        "rating": 4.9,
        "reviews_count": 74,
        "price_per_hour": 4500,
        "capacity": 60,
        "image_url": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
        "description": "Большой многофункциональный зал со сценой, профессиональным звуковым оборудованием и регулируемым атмосферным светом. Идеален для мероприятий и лекций.",
        "amenities": [
            "Сцена",
            "Звук и микрофоны",
            "Гримёрка",
            "Проектор Full HD",
            "Вместимость до 60 гостей"
        ],
        "reviews": []
    },
    {
        "name": "Grain",
        "category": "Коворкинги",
        "metro": "м. Бауманская",
        "address": "Москва, ул. Бауманская, 15",
        "area": 110,
        "rating": 4.7,
        "reviews_count": 40,
        "price_per_hour": 1800,
        "capacity": 24,
        "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        "description": "Тихое и эстетичное пространство с деревянными столами, быстрым Wi-Fi, кофе-зоной и переговорными комнатами для продуктивной работы.",
        "amenities": [
            "24 рабочих места",
            "Высокоскоростной Wi-Fi",
            "Кофе-поинт и чай",
            "Переговорная комната",
            "Принтер и МФУ"
        ],
        "reviews": []
    }
]

BLOG_POSTS_DATA = [
    {
        "title": "Как выбрать студию под съёмку: чек-лист из 12 пунктов",
        "category": "Гайды",
        "read_time": "8 мин чтения · 20 октября 2026",
        "description": "Площадь, высота потолков, тип света, гримёрка и логистика — что проверить до того, как оплатить бронь.",
        "image_url": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
        "is_featured": True
    },
    {
        "title": "Три схемы света для портрета на циклораме",
        "category": "Свет",
        "read_time": "6 мин",
        "description": "Классика, high-key и контровой — что поставить и где, если в студии 3 источника.",
        "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        "is_featured": False
    },
    {
        "title": "Как провести мастер-класс в арендованном зале",
        "category": "Мероприятия",
        "read_time": "5 мин",
        "description": "Посадка, звук, тайминг и что спросить у площадки заранее.",
        "image_url": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
        "is_featured": False
    },
    {
        "title": "Коворкинг на день: когда это выгоднее офиса",
        "category": "Гайды",
        "read_time": "4 мин",
        "description": "Считаем на примере команды из пяти человек.",
        "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        "is_featured": False
    },
    {
        "title": "Дневной свет vs импульс: что выбрать для каталога",
        "category": "Свет",
        "read_time": "7 мин",
        "description": "Плюсы, минусы и как не потерять цвет одежды.",
        "image_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
        "is_featured": False
    },
    {
        "title": "Что взять с собой на первую съёмку в студии",
        "category": "Гайды",
        "read_time": "3 мин",
        "description": "Короткий список, который спасёт от лишней беготни.",
        "image_url": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
        "is_featured": False
    },
    {
        "title": "Как сделать фото площадки, чтобы её бронировали",
        "category": "Владельцам",
        "read_time": "6 мин",
        "description": "Ракурсы, время суток и что убрать из кадра.",
        "image_url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
        "is_featured": False
    }
]

async def seed_database():
    await init_db()

    async with async_session_maker() as session:
        # 1. Залы
        for data in ROOMS_DATA:
            query = select(Room).where(Room.name == data["name"])
            result = await session.execute(query)
            existing_room = result.scalar_one_or_none()

            if existing_room:
                print(f"[SKIP] Зал '{data['name']}' уже есть в базе данных.")
                continue

            room = Room(
                name=data["name"],
                category=data.get("category", "Фотостудия"),
                metro=data.get("metro", "м. Белорусская"),
                address=data.get("address", "Москва, ул. Лесная, 7"),
                area=data.get("area", 80),
                rating=data.get("rating", 4.9),
                reviews_count=data.get("reviews_count", 128),
                description=data["description"],
                price_per_hour=data["price_per_hour"],
                capacity=data["capacity"],
                image_url=data["image_url"],
                is_active=True
            )

            for amenity_name in data["amenities"]:
                room.amenities.append(RoomAmenity(name=amenity_name))

            for day in range(7):
                room.schedules.append(
                    Schedule(
                        day_of_week=day,
                        open_time=time(hour=9, minute=0),
                        close_time=time(hour=22, minute=0)
                    )
                )

            for rev in data.get("reviews", []):
                room.reviews.append(
                    Review(
                        author_name=rev["author_name"],
                        rating=rev["rating"],
                        text=rev["text"]
                    )
                )

            session.add(room)
            print(f"[OK] Добавлен зал: {data['name']} ({data.get('category')}, {data.get('metro')})")

        # 2. Статьи блога
        for post_data in BLOG_POSTS_DATA:
            p_res = await session.execute(select(BlogPost).where(BlogPost.title == post_data["title"]))
            if p_res.scalar_one_or_none():
                continue
            post = BlogPost(
                title=post_data["title"],
                category=post_data["category"],
                read_time=post_data["read_time"],
                description=post_data["description"],
                image_url=post_data["image_url"],
                is_featured=post_data["is_featured"]
            )
            session.add(post)
            print(f"[OK] Добавлена статья блога: {post_data['title']}")

        await session.commit()
        print("\nБаза успешно наполнена данными из макетов Figma (залы, отзывы, статьи блога).")

if __name__ == "__main__":
    asyncio.run(seed_database())
