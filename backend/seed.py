import asyncio
from datetime import time
from sqlalchemy import select, func, delete
from database import async_session_maker, init_db
from models import (
    Room, RoomAmenity, Schedule, Review, BlogPost, User, UserRole,
    Studio, Service, PromoCode, ServiceCategory
)
from auth import hash_password
from main import recalc_room_rating

# тестовый админ для входа в админку
ADMIN_EMAIL = "admin@space.ru"
ADMIN_PASSWORD = "admin123"

ROOMS_DATA = [
    {
        "name": "Moody",
        "studio_name": "SPACE Artplay",
        "category": "Фотостудия",
        "metro": "Ленинский р-н",
        "address": "Ростов-на-Дону, ул. Большая Садовая, 47",
        "area": 80,
        "rating": 0.0,
        "reviews_count": 0,
        "price_per_hour": 2500,
        "capacity": 10,
        "image_url": "/images/rooms/moody.jpg",
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
        "reviews": []
    },
    {
        "name": "Loft North",
        "studio_name": "SPACE Artplay",
        "category": "Залы",
        "metro": "Кировский р-н",
        "address": "Ростов-на-Дону, пр. Будённовский, 49",
        "area": 95,
        "rating": 0.0,
        "reviews_count": 0,
        "price_per_hour": 3200,
        "capacity": 15,
        "image_url": "/images/rooms/loft-north.jpg",
        "description": "Интерьерный зал с панорамными окнами 4 м, фактурной кирпичной кладкой, винтажным кожаным диваном и теплым естественным светом. Отлично подходит для мастер-классов и съемок.",
        "amenities": [
            "Окна 4 м",
            "Гримёрка",
            "2x Постоянный свет Aputure 300d II",
            "Бумажные фоны",
            "Bluetooth-колонка Marshall"
        ],
        "reviews": []
    },
    {
        "name": "White Box",
        "studio_name": "SPACE Artplay",
        "category": "Фотостудия",
        "metro": "Кировский р-н",
        "address": "Ростов-на-Дону, ул. Пушкинская, 36",
        "area": 65,
        "rating": 0.0,
        "reviews_count": 0,
        "price_per_hour": 2200,
        "capacity": 8,
        "image_url": "/images/rooms/white-box.jpg",
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
        "studio_name": "SPACE Artplay",
        "category": "Фотостудия",
        "metro": "Кировский р-н",
        "address": "Ростов-на-Дону, пр. Ворошиловский, 46",
        "area": 90,
        "rating": 0.0,
        "reviews_count": 0,
        "price_per_hour": 2900,
        "capacity": 8,
        "image_url": "/images/rooms/noir.jpg",
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
        "studio_name": "SPACE Artplay",
        "category": "Залы",
        "metro": "Ленинский р-н",
        "address": "Ростов-на-Дону, ул. Социалистическая, 74",
        "area": 150,
        "rating": 0.0,
        "reviews_count": 0,
        "price_per_hour": 4500,
        "capacity": 60,
        "image_url": "/images/rooms/violet-hall.jpg",
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
        "studio_name": "SPACE Flacon",
        "category": "Коворкинги",
        "metro": "Октябрьский р-н",
        "address": "Ростов-на-Дону, пр. Михаила Нагибина, 32",
        "area": 110,
        "rating": 0.0,
        "reviews_count": 0,
        "price_per_hour": 1800,
        "capacity": 24,
        "image_url": "/images/rooms/grain.jpg",
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
        "image_url": "/images/blog/1.jpg",
        "is_featured": True
    },
    {
        "title": "Три схемы света для портрета на циклораме",
        "category": "Свет",
        "read_time": "6 мин",
        "description": "Классика, high-key и контровой — что поставить и где, если в студии 3 источника.",
        "image_url": "/images/blog/2.jpg",
        "is_featured": False
    },
    {
        "title": "Как провести мастер-класс в арендованном зале",
        "category": "Мероприятия",
        "read_time": "5 мин",
        "description": "Посадка, звук, тайминг и что спросить у площадки заранее.",
        "image_url": "/images/blog/3.jpg",
        "is_featured": False
    },
    {
        "title": "Коворкинг на день: когда это выгоднее офиса",
        "category": "Гайды",
        "read_time": "4 мин",
        "description": "Считаем на примере команды из пяти человек.",
        "image_url": "/images/blog/4.jpg",
        "is_featured": False
    },
    {
        "title": "Дневной свет vs импульс: что выбрать для каталога",
        "category": "Свет",
        "read_time": "7 мин",
        "description": "Плюсы, минусы и как не потерять цвет одежды.",
        "image_url": "/images/blog/5.jpg",
        "is_featured": False
    },
    {
        "title": "Что взять с собой на первую съёмку в студии",
        "category": "Гайды",
        "read_time": "3 мин",
        "description": "Короткий список, который спасёт от лишней беготни.",
        "image_url": "/images/blog/6.jpg",
        "is_featured": False
    },
    {
        "title": "Как сделать фото площадки, чтобы её бронировали",
        "category": "Владельцам",
        "read_time": "6 мин",
        "description": "Ракурсы, время суток и что убрать из кадра.",
        "image_url": "/images/blog/7.jpg",
        "is_featured": False
    }
]

STUDIOS_DATA = {
    "SPACE Artplay": {
        "city": "Ростов-на-Дону",
        "address": "Ростов-на-Дону, ул. Большая Садовая, 47",
        "metro": "Ленинский р-н",
        "phone": "+7 (863) 310-45-77",
        "email": "artplay@space.ru",
        "description": "Флагманский комплекс студий в центре Ростова-на-Дону: циклорамы, естественный свет и всё необходимое для съёмок."
    },
    "SPACE Flacon": {
        "city": "Ростов-на-Дону",
        "address": "Ростов-на-Дону, пр. Михаила Нагибина, 32",
        "metro": "Октябрьский р-н",
        "phone": "+7 (863) 310-45-88",
        "email": "flacon@space.ru",
        "description": "Креативные залы, коворкинг и лофты для работы и съёмок."
    }
}

async def seed_database():
    await init_db()
    async with async_session_maker() as session:
        # Удаляем только старые демонстрационные отзывы из сида.
        # Все отзывы с привязкой к клиенту или брони сохраняются.
        demo_rooms = select(Room.id).where(Room.name.in_(["Moody", "Loft North"]))
        await session.execute(delete(Review).where(
            Review.room_id.in_(demo_rooms),
            Review.user_id.is_(None),
            Review.booking_id.is_(None),
            Review.author_name.in_(["Ольга П.", "Илья Р.", "Ксения М.", "Дмитрий С."])
        ))
        # 0. Студии (Studios)
        studios_map = {}
        for s_name, s_info in STUDIOS_DATA.items():
            s_res = await session.execute(select(Studio).where(Studio.name == s_name))
            studio = s_res.scalar_one_or_none()
            if not studio:
                studio = Studio(
                    name=s_name,
                    city=s_info["city"],
                    address=s_info["address"],
                    metro=s_info["metro"],
                    phone=s_info["phone"],
                    email=s_info["email"],
                    description=s_info["description"]
                )
                session.add(studio)
                await session.flush()
                print(f"[OK] Добавлена студия: {s_name}")
            else:
                studio.city = s_info["city"]
                studio.address = s_info["address"]
                studio.metro = s_info["metro"]
                studio.phone = s_info["phone"]
                studio.email = s_info["email"]
                studio.description = s_info["description"]
                await session.flush()
                print(f"[OK] Обновлена студия: {s_name}")
            studios_map[s_name] = studio

        # 0.1 Каталог платных услуг (Services)
        SERVICES_DATA = [
            ("Дополнительный импульсный свет Profoto", ServiceCategory.EQUIPMENT, 800, False, "Моноблок D2 500 AirTTL со стойкой"),
            ("Постоянный видеосвет Aputure 300d", ServiceCategory.EQUIPMENT, 1000, True, "Мощный светодиодный прибор с софтбоксом"),
            ("Цветной бумажный фон (раскатка)", ServiceCategory.EQUIPMENT, 500, False, "Раскатка чистого фона под ноги (1 цвет)"),
            ("Дым-машина с пультом DMX", ServiceCategory.EQUIPMENT, 1200, False, "Генератор безопасного плотного дыма для сцен"),
            ("Гримерное место до съемки (1 час)", ServiceCategory.MAKEUP, 500, True, "Стол визажиста с нейтральной подсветкой"),
            ("Ассистент по свету на площадке", ServiceCategory.ASSISTANT, 1500, True, "Помощь в установке световых схем и смена насадок"),
        ]
        for s_name, s_cat, s_price, s_hourly, s_desc in SERVICES_DATA:
            chk = await session.execute(select(Service).where(Service.name == s_name))
            if not chk.scalar_one_or_none():
                session.add(Service(
                    name=s_name,
                    category=s_cat,
                    price=s_price,
                    is_per_hour=s_hourly,
                    description=s_desc
                ))
                print(f"[OK] Добавлена услуга: {s_name} ({s_price} руб)")

        # 0.2 Промокоды (PromoCodes)
        PROMOS_DATA = [
            ("SPACE2026", 15, 2000, 100),
            ("STUDENT", 20, 1500, 200),
            ("WELCOME", 10, None, 500)
        ]
        for p_code, p_pct, p_max, p_uses in PROMOS_DATA:
            p_chk = await session.execute(select(PromoCode).where(PromoCode.code == p_code))
            if not p_chk.scalar_one_or_none():
                session.add(PromoCode(
                    code=p_code,
                    discount_percent=p_pct,
                    max_discount=p_max,
                    max_uses=p_uses
                ))
                print(f"[OK] Добавлен промокод: {p_code} (-{p_pct}%)")

        # 1. Залы
        for data in ROOMS_DATA:
            query = select(Room).where(Room.name == data["name"])
            result = await session.execute(query)
            existing_room = result.scalar_one_or_none()

            target_studio = studios_map.get(data.get("studio_name"))
            studio_id = target_studio.id if target_studio else None

            if existing_room:
                # Обновляем поля существующего зала (адрес, район, фото, студия)
                existing_room.studio_id = studio_id
                existing_room.category = data.get("category", "Фотостудия")
                existing_room.metro = data.get("metro", "Ленинский р-н")
                existing_room.address = data.get("address", "Ростов-на-Дону, ул. Большая Садовая, 47")
                existing_room.area = data.get("area", 80)
                existing_room.price_per_hour = data["price_per_hour"]
                existing_room.capacity = data["capacity"]
                existing_room.image_url = data["image_url"]
                existing_room.description = data["description"]

                # Проверяем и добавляем отзывы, если их нет
                r_chk = await session.execute(select(Review).where(Review.room_id == existing_room.id))
                curr_reviews = r_chk.scalars().all()
                if not curr_reviews and data.get("reviews"):
                    for rev in data["reviews"]:
                        session.add(Review(
                            room_id=existing_room.id,
                            author_name=rev["author_name"],
                            rating=rev["rating"],
                            text=rev["text"]
                        ))
                await session.flush()
                await session.commit()
                await recalc_room_rating(session, existing_room.id)
                print(f"[OK] Обновлен зал: {data['name']} ({data.get('category')}, {data.get('metro')})")
                continue

            room = Room(
                studio_id=studio_id,
                name=data["name"],
                category=data.get("category", "Фотостудия"),
                metro=data.get("metro", "Ленинский р-н"),
                address=data.get("address", "Ростов-на-Дону, ул. Большая Садовая, 47"),
                area=data.get("area", 80),
                rating=0.0,
                reviews_count=0,
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
            await session.flush()
            await session.commit()
            await recalc_room_rating(session, room.id)
            print(f"[OK] Добавлен зал: {data['name']} ({data.get('category')}, {data.get('metro')})")

        # 2. Статьи блога
        for post_data in BLOG_POSTS_DATA:
            p_res = await session.execute(select(BlogPost).where(BlogPost.title == post_data["title"]))
            existing_post = p_res.scalar_one_or_none()
            if existing_post:
                existing_post.image_url = post_data["image_url"]
                existing_post.category = post_data["category"]
                existing_post.read_time = post_data["read_time"]
                existing_post.description = post_data["description"]
                existing_post.is_featured = post_data["is_featured"]
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

        # 3. Администратор
        a_res = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        if not a_res.scalar_one_or_none():
            session.add(User(
                email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                full_name="Администратор",
                role=UserRole.ADMIN
            ))
            print(f"[OK] Добавлен администратор: {ADMIN_EMAIL}")

        await session.commit()
        print("\nБаза успешно наполнена данными (Ростов-на-Дону, реальные рейтинги, локальные изображения).")

if __name__ == "__main__":
    asyncio.run(seed_database())
