from beanie import Document
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ActivityLevel(str, Enum):
    SEDENTARY = "sedentary"
    LIGHT = "light"
    MODERATE = "moderate"
    ACTIVE = "active"
    VERY_ACTIVE = "very_active"

class Goal(str, Enum):
    WEIGHT_LOSS = "weight_loss"
    WEIGHT_GAIN = "weight_gain"
    MAINTAIN = "maintain"
    MUSCLE_GAIN = "muscle_gain"
    HEALTH = "health"

class UserProfile(BaseModel):
    age: Optional[int] = None
    weight: Optional[float] = None  # kg
    height: Optional[float] = None  # cm
    activity_level: Optional[ActivityLevel] = ActivityLevel.MODERATE
    goal: Optional[Goal] = Goal.HEALTH
    target_weight: Optional[float] = None
    gym_days_per_week: Optional[int] = 3
    medical_conditions: Optional[List[str]] = []
    allergies: Optional[List[str]] = []

class User(Document):
    email: EmailStr = Field(..., unique=True)
    username: str = Field(..., min_length=3, max_length=50)
    hashed_password: str
    full_name: Optional[str] = None
    profile: Optional[UserProfile] = Field(default_factory=UserProfile)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "username",
            "created_at"
        ]

# Schemas para requests/responses
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    profile: Optional[UserProfile] = None
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    profile: Optional[UserProfile] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse