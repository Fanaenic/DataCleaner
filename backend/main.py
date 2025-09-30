from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from PIL import Image, ImageFilter
import uvicorn
import os
import jwt
import datetime
from pathlib import Path
import io
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
SECRET_KEY = "your-secret-key-here"  # В реальном проекте храните в .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Создаем приложение FastAPI
app = FastAPI(title="Data Anonymization API", version="1.0")

# Разрешаем запросы от React приложения
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем папки если их нет
Path("uploads").mkdir(exist_ok=True)
Path("static").mkdir(exist_ok=True)

# Раздаем статические файлы
app.mount("/static", StaticFiles(directory="static"), name="static")

# Security
security = HTTPBearer()

# Временное хранилище пользователей (в реальном проекте используйте БД)
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


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return email
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


# Функции обработки изображений (оставляем ваши)
def create_sample_face_regions(image):
    """Создает примерные области лиц для демонстрации"""
    width, height = image.size
    regions = []

    if width > 200 and height > 200:
        regions.append((
            int(width / 2 - 50),
            int(height / 2 - 50),
            int(width / 2 + 50),
            int(height / 2 + 50)
        ))

    if width > 400 and height > 400:
        regions.append((50, 50, 150, 150))
        regions.append((width - 150, 50, width - 50, 150))

    return regions


def blur_faces_pil(image):
    """Размытие 'лиц' с помощью PIL"""
    face_regions = create_sample_face_regions(image)
    faces_detected = len(face_regions)

    for region in face_regions:
        face_region = image.crop(region)
        blurred_face = face_region.filter(ImageFilter.GaussianBlur(radius=20))
        image.paste(blurred_face, region)

    return image, faces_detected


def blur_license_plates_pil(image):
    """Размытие нижней части изображения"""
    width, height = image.size
    license_height = int(height * 0.15)
    license_region = (0, height - license_height, width, height)

    license_area = image.crop(license_region)
    blurred_license = license_area.filter(ImageFilter.GaussianBlur(radius=15))
    image.paste(blurred_license, license_region)

    return image


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
        "password": user.password  # Хэшируйте в реальном проекте!
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
async def get_profile(email: str = Depends(verify_token)):
    user = users_db.get(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"name": user["name"], "email": user["email"]}


# Защищенные эндпоинты
@app.post("/upload/")
async def upload_file(
        file: UploadFile = File(...),
        email: str = Depends(verify_token)
):
    """Эндпоинт для загрузки и обработки изображений (только для авторизованных)"""
    try:
        print(f"Processing file for user {email}: {file.filename}")

        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        if image.mode != 'RGB':
            image = image.convert('RGB')

        processed_image, faces_detected = blur_faces_pil(image)
        processed_image = blur_license_plates_pil(processed_image)

        processed_filename = f"processed_{file.filename}"
        processed_path = f"static/{processed_filename}"
        processed_image.save(processed_path, "JPEG", quality=95)

        return {
            "message": "File processed successfully",
            "original_filename": file.filename,
            "processed_filename": processed_filename,
            "processed_url": f"/static/{processed_filename}",
            "faces_detected": faces_detected,
            "status": "success"
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@app.get("/")
def read_root():
    return {"message": "Data Anonymization API is working!"}


@app.get("/test")
def test_endpoint():
    return {
        "status": "API is working!",
        "endpoints": {
            "POST /register/": "User registration",
            "POST /login/": "User login",
            "GET /profile/": "Get user profile",
            "POST /upload/": "Upload and process image",
            "GET /test": "Test endpoint"
        }
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)