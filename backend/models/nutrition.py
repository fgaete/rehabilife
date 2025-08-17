from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class MealType(str, Enum):
    BREAKFAST = "breakfast"
    SNACK_MORNING = "snack_morning"
    LUNCH = "lunch"
    SNACK_AFTERNOON = "snack_afternoon"
    DINNER = "dinner"
    SNACK_EVENING = "snack_evening"
    OTHER = "other"

class FoodCategory(str, Enum):
    PROTEIN = "protein"
    CARBS = "carbs"
    FATS = "fats"
    VEGETABLES = "vegetables"
    FRUITS = "fruits"
    DAIRY = "dairy"
    BEVERAGES = "beverages"
    ALCOHOL = "alcohol"
    PROCESSED = "processed"
    SUPPLEMENTS = "supplements"

class NutritionInfo(BaseModel):
    calories: Optional[float] = 0
    protein: Optional[float] = 0  # gramos
    carbs: Optional[float] = 0    # gramos
    fats: Optional[float] = 0     # gramos
    fiber: Optional[float] = 0    # gramos
    sugar: Optional[float] = 0    # gramos
    sodium: Optional[float] = 0   # mg

class FoodEntry(Document):
    user_id: str = Field(..., index=True)
    food_name: str
    quantity: float  # en gramos o unidades
    unit: str = "gramos"  # gramos, unidades, tazas, etc.
    meal_type: MealType
    category: FoodCategory
    nutrition: NutritionInfo = Field(default_factory=NutritionInfo)
    notes: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "food_entries"
        indexes = [
            "user_id",
            "date",
            "meal_type",
            "category"
        ]

class WaterEntry(Document):
    user_id: str = Field(..., index=True)
    amount: float  # en ml
    date: datetime = Field(default_factory=datetime.utcnow, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "water_entries"
        indexes = [
            "user_id",
            "date"
        ]

# Schemas para requests/responses
class FoodEntryCreate(BaseModel):
    food_name: str
    quantity: float
    unit: str = "gramos"
    meal_type: MealType
    category: FoodCategory
    nutrition: Optional[NutritionInfo] = Field(default_factory=NutritionInfo)
    notes: Optional[str] = None

class FoodEntryResponse(BaseModel):
    id: str
    food_name: str
    quantity: float
    unit: str
    meal_type: MealType
    category: FoodCategory
    nutrition: NutritionInfo
    notes: Optional[str] = None
    date: datetime
    created_at: datetime

class WaterEntryCreate(BaseModel):
    amount: float

class WaterEntryResponse(BaseModel):
    id: str
    amount: float
    date: datetime
    created_at: datetime

class DailyNutritionSummary(BaseModel):
    date: datetime
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fats: float
    total_fiber: float
    total_water: float
    meals_by_type: Dict[str, List[FoodEntryResponse]]
    water_entries: List[WaterEntryResponse]
    
class NutritionGoals(BaseModel):
    daily_calories: Optional[float] = 2000
    daily_protein: Optional[float] = 150  # gramos
    daily_carbs: Optional[float] = 250    # gramos
    daily_fats: Optional[float] = 65      # gramos
    daily_water: Optional[float] = 2000   # ml