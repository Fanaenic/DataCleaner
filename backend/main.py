from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import jwt
import datetime
from typing import Optional


# Модели данных
class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# Настройки
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Создаем приложение FastAPI
app = FastAPI(title="DataCleaner API", version="1.0")

# Разрешаем запросы от React приложения
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Временное хранилище пользователей
users_db = {}


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Эндпоинты аутентификации
@app.post("/register/", response_model=Token)
async def register(user: UserRegister):
    if user.email in users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # В реальном проекте хэшируйте пароль!
    users_db[user.email] = {
        "name": user.name,
        "email": user.email,
        "password": user.password
    }

    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/login/", response_model=Token)
async def login(user: UserLogin):
    if user.email not in users_db or users_db[user.email]["password"] != user.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/profile/")
async def get_profile(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or email not in users_db:
            raise HTTPException(status_code=404, detail="User not found")

        user = users_db[email]
        return {"name": user["name"], "email": user["email"]}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/")
def read_root():
    return {"message": "DataCleaner API is working!"}


@app.get("/test")
def test_endpoint():
    return {
        "status": "API is working!",
        "endpoints": {
            "POST /register/": "User registration",
            "POST /login/": "User login",
            "GET /profile/": "Get user profile",
            "GET /test": "Test endpoint"
        }
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)