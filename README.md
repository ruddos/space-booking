# Онлайн-сервис бронирования залов фотостудии (SPACE)

Проект по дисциплине «Технологии веб-программирования» (Траектория «Юпитер»).

## 1. Команда и роли
- **Backend-разработчик:** Александр — проектирование БД, бизнес-логика слотов, авторизация, REST API на FastAPI.
- **Frontend-разработчик:** Даниэль — клиентский интерфейс, маршрутизация, формы, работа с API на React.

## 2. Предметная область и специфика
Сервис бронирования помещений (залов фотостудии) с почасовой арендой.
- **Динамический расчет свободных слотов на стороне Backend:** сервер анализирует расписание работы зала за вычетом уже существующих подтвержденных броней и отдает фронтенду массив доступных часов.
- **Защита от овербукинга:** исключение пересечения интервалов времени и двойного бронирования на уровне транзакций базы данных.

## 3. Стек технологий
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, bcrypt, PyJWT
- **База данных:** PostgreSQL 16 (Docker)
- **Frontend:** React, Vite, Tailwind CSS

## 4. Архитектура приложения
Трехзвенная архитектура (Клиент — Сервер — База данных):
1. **Frontend (SPA):** пользовательский интерфейс, формы валидации, календарная сетка свободных часов, личный кабинет клиента и администратора.
2. **Backend (FastAPI REST API):** 
   - Модуль аутентификации (JWT, роли `CLIENT` и `ADMIN`);
   - Сервис генерации свободных таймслотов;
   - Валидация броней на отсутствие пересечений интервалов;
   - Защищенный административный интерфейс управления сущностями.
3. **Database (PostgreSQL):** реляционное хранение данных, связи сущностей, транзакционная целостность записей.

## 5. Предварительная модель данных (ER)
1. **User (`users`):** `id`, `email`, `hashed_password`, `full_name`, `phone`, `role` (CLIENT / ADMIN), `created_at`.
2. **Room (`rooms`):** `id`, `name`, `category`, `description`, `price_per_hour`, `capacity`, `area`, `metro`, `address`, `rating`, `reviews_count`, `image_url`, `is_active`.
3. **Schedule (`schedules`):** `id`, `room_id` (FK), `day_of_week` (0-6), `open_time`, `close_time`.
4. **Booking (`bookings`):** `id`, `booking_number` (SP-XXXXXX), `user_id` (FK), `room_id` (FK), `start_time`, `end_time`, `status` (PENDING / CONFIRMED / CANCELLED), `total_price`, `additional_services`, `comment`, `contact_name`, `contact_phone`, `created_at`.
5. **RoomAmenity (`room_amenities`):** `id`, `room_id` (FK), `name` (свет, циклорама, гримерка).
6. **Review (`reviews`):** `id`, `room_id` (FK), `author_name`, `rating`, `text`, `created_at`.
7. **Favorite (`favorites`):** `id`, `user_id` (FK), `room_id` (FK).
8. **BlogPost (`blog_posts`):** `id`, `title`, `category`, `read_time`, `description`, `image_url`, `is_featured`, `created_at`.
9. **ContactMessage (`contact_messages`):** `id`, `name`, `email`, `topic`, `message`, `created_at`.

## 6. План функционала по этапам
- **КТ1 (Старт):** предметная область, стек, репозиторий, диаграмма прецедентов, архитектура.
- **КТ2 (Промежуточный результат):** CRUD залов, миграции БД, базовая авторизация, скелет админки.
- **КТ3 (Интеграция):** алгоритм проверки слотов на бэке, создание брони с фронта, смена статусов админом.

## 7. Инструкция по локальному запуску (Quick Start)

### Шаг 1. Запуск базы данных в Docker
Убедитесь, что запущен **Docker Desktop**, затем в корне проекта выполните:
```powershell
docker compose up -d
```
База поднимается на порту **5433** (чтобы не конфликтовать с другими postgres на 5432). Порт можно поменять через переменную `DB_PORT`, а адрес базы для бэкенда — через `DATABASE_URL`.

### Шаг 2. Установка зависимостей бэкенда
```powershell
cd backend
pip install -r requirements.txt
```

### Шаг 3. Первичное наполнение базы данными (залы, расписание, блог, отзывы)
```powershell
python seed.py
```

### Шаг 4. Запуск сервера API
```powershell
python -m uvicorn main:app --reload
```
После запуска сервер доступен по адресу: `http://127.0.0.1:8000`.

### Шаг 5. Интерактивная документация (Swagger UI)
Откройте в браузере:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

### Шаг 6. Запуск фронтенда
```powershell
cd frontend
npm install
npm run dev
```
Сайт: `http://localhost:5173`, запросы `/api` проксируются на бэкенд (`127.0.0.1:8000`).

Админ-панель: `http://localhost:5173/admin`. Тестовый администратор создается в `seed.py`: `admin@space.ru` / `admin123`.

---

## 8. Спецификация реализованного REST API

### Аутентификация и профиль (Auth)
- `POST /api/auth/register` — регистрация клиента с хешированием пароля (`bcrypt`) и выдачей JWT.
- `POST /api/auth/login` — авторизация пользователя по email и паролю.
- `GET /api/auth/me` — получение профиля текущего пользователя (Bearer токен).

### Каталог площадок и слоты (Rooms)
- `GET /api/rooms` — список площадок с фильтрацией по категории, поиску, цене, вместимости и авторасчетом свободных слотов на сегодня (`today_available_slots`).
- `GET /api/rooms/{id}` — детальная информация о студии с оборудованием, часами работы и отзывами.
- `GET /api/rooms/{id}/available-slots?date=YYYY-MM-DD` — расчет доступных слотов времени с проверкой расписания и существующих броней.
- `POST /api/rooms` — добавление новой площадки с оборудованием и расписанием (только для ADMIN).

### Бронирования (Bookings)
- `POST /api/bookings` — создание брони с защитой от овербукинга, расчетом доп. услуг и генерацией номера `SP-XXXXXX`.
- `GET /api/bookings/my?tab=upcoming|past|cancelled` — бронирования пользователя для личного кабинета.
- `PATCH /api/bookings/{id}/cancel` — отмена бронирования пользователем.

### Избранное (Favorites)
- `GET /api/favorites` — список избранных площадок пользователя.
- `POST /api/favorites/{room_id}` — добавление студии в избранное.
- `DELETE /api/favorites/{room_id}` — удаление студии из избранного.

### Блог и Контакты
- `GET /api/blog/posts` — статьи блога с фильтром по категориям.
- `POST /api/newsletter/subscribe` — подписка на email-рассылку.
- `POST /api/contact` — отправка формы обратной связи («Напиши нам»).

### Административная панель (Admin)
- `GET /api/admin/bookings` — просмотр всех броней в системе.
- `PATCH /api/admin/bookings/{id}/status` — изменение статуса бронирования (CONFIRMED / CANCELLED / PENDING).

---

## Предварительная модель данных
![Database Schema](docs/database_schema.png)

## Диаграмма прецедентов (Use Case)
![Use Case Diagram](docs/use_case_diagram.png)
