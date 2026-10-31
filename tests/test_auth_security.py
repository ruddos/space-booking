import pytest
from auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM
import jwt

def test_password_hashing():
    raw = "secret123"
    hashed = hash_password(raw)

    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_generation():
    token = create_access_token(data={"sub": "test@space.ru", "role": "client"})
    assert isinstance(token, str)
    assert len(token) > 20

    # Декодирование токена
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "test@space.ru"
    assert payload["role"] == "client"
    assert "exp" in payload
