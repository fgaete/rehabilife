from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
from collections import defaultdict

from models.user import User
from models.nutrition import (
    FoodEntry, WaterEntry, FoodEntryCreate, FoodEntryResponse,
    WaterEntryCreate, WaterEntryResponse, DailyNutritionSummary,
    NutritionGoals, MealType, FoodCategory
)
from routers.auth import get_current_active_user
from services.nutrition_advice import get_nutrition_advice

router = APIRouter()

@router.post("/food", response_model=FoodEntryResponse)
async def add_food_entry(food_data: FoodEntryCreate, current_user: User = Depends(get_current_active_user)):
    """Agregar entrada de comida"""
    food_entry = FoodEntry(
        user_id=str(current_user.id),
        **food_data.dict()
    )
    
    await food_entry.insert()
    
    return FoodEntryResponse(
        id=str(food_entry.id),
        food_name=food_entry.food_name,
        quantity=food_entry.quantity,
        unit=food_entry.unit,
        meal_type=food_entry.meal_type,
        category=food_entry.category,
        nutrition=food_entry.nutrition,
        notes=food_entry.notes,
        date=food_entry.date,
        created_at=food_entry.created_at
    )

@router.post("/water", response_model=WaterEntryResponse)
async def add_water_entry(water_data: WaterEntryCreate, current_user: User = Depends(get_current_active_user)):
    """Agregar entrada de agua"""
    water_entry = WaterEntry(
        user_id=str(current_user.id),
        amount=water_data.amount
    )
    
    await water_entry.insert()
    
    return WaterEntryResponse(
        id=str(water_entry.id),
        amount=water_entry.amount,
        date=water_entry.date,
        created_at=water_entry.created_at
    )

@router.get("/food", response_model=List[FoodEntryResponse])
async def get_food_entries(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    meal_type: Optional[MealType] = Query(None),
    category: Optional[FoodCategory] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener entradas de comida con filtros"""
    query_filters = [FoodEntry.user_id == str(current_user.id)]
    
    if start_date:
        query_filters.append(FoodEntry.date >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query_filters.append(FoodEntry.date <= datetime.combine(end_date, datetime.max.time()))
    if meal_type:
        query_filters.append(FoodEntry.meal_type == meal_type)
    if category:
        query_filters.append(FoodEntry.category == category)
    
    food_entries = await FoodEntry.find(*query_filters).sort(-FoodEntry.date).limit(limit).to_list()
    
    return [
        FoodEntryResponse(
            id=str(entry.id),
            food_name=entry.food_name,
            quantity=entry.quantity,
            unit=entry.unit,
            meal_type=entry.meal_type,
            category=entry.category,
            nutrition=entry.nutrition,
            notes=entry.notes,
            date=entry.date,
            created_at=entry.created_at
        ) for entry in food_entries
    ]

@router.get("/water", response_model=List[WaterEntryResponse])
async def get_water_entries(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener entradas de agua con filtros"""
    query_filters = [WaterEntry.user_id == str(current_user.id)]
    
    if start_date:
        query_filters.append(WaterEntry.date >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query_filters.append(WaterEntry.date <= datetime.combine(end_date, datetime.max.time()))
    
    water_entries = await WaterEntry.find(*query_filters).sort(-WaterEntry.date).limit(limit).to_list()
    
    return [
        WaterEntryResponse(
            id=str(entry.id),
            amount=entry.amount,
            date=entry.date,
            created_at=entry.created_at
        ) for entry in water_entries
    ]

@router.get("/daily-summary", response_model=DailyNutritionSummary)
async def get_daily_nutrition_summary(
    target_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener resumen nutricional diario"""
    if not target_date:
        target_date = date.today()
    
    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.max.time())
    
    # Obtener entradas de comida del día
    food_entries = await FoodEntry.find(
        FoodEntry.user_id == str(current_user.id),
        FoodEntry.date >= start_datetime,
        FoodEntry.date <= end_datetime
    ).to_list()
    
    # Obtener entradas de agua del día
    water_entries = await WaterEntry.find(
        WaterEntry.user_id == str(current_user.id),
        WaterEntry.date >= start_datetime,
        WaterEntry.date <= end_datetime
    ).to_list()
    
    # Calcular totales nutricionales
    total_calories = sum(entry.nutrition.calories for entry in food_entries)
    total_protein = sum(entry.nutrition.protein for entry in food_entries)
    total_carbs = sum(entry.nutrition.carbs for entry in food_entries)
    total_fats = sum(entry.nutrition.fats for entry in food_entries)
    total_fiber = sum(entry.nutrition.fiber for entry in food_entries)
    total_water = sum(entry.amount for entry in water_entries)
    
    # Agrupar comidas por tipo
    meals_by_type = defaultdict(list)
    for entry in food_entries:
        meals_by_type[entry.meal_type.value].append(
            FoodEntryResponse(
                id=str(entry.id),
                food_name=entry.food_name,
                quantity=entry.quantity,
                unit=entry.unit,
                meal_type=entry.meal_type,
                category=entry.category,
                nutrition=entry.nutrition,
                notes=entry.notes,
                date=entry.date,
                created_at=entry.created_at
            )
        )
    
    water_responses = [
        WaterEntryResponse(
            id=str(entry.id),
            amount=entry.amount,
            date=entry.date,
            created_at=entry.created_at
        ) for entry in water_entries
    ]
    
    return DailyNutritionSummary(
        date=start_datetime,
        total_calories=total_calories,
        total_protein=total_protein,
        total_carbs=total_carbs,
        total_fats=total_fats,
        total_fiber=total_fiber,
        total_water=total_water,
        meals_by_type=dict(meals_by_type),
        water_entries=water_responses
    )

@router.put("/food/{food_id}", response_model=FoodEntryResponse)
async def update_food_entry(food_id: str, food_data: FoodEntryCreate, current_user: User = Depends(get_current_active_user)):
    """Actualizar entrada de comida"""
    food_entry = await FoodEntry.get(food_id)
    
    if not food_entry or food_entry.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada de comida no encontrada"
        )
    
    # Actualizar campos
    for field, value in food_data.dict(exclude_unset=True).items():
        setattr(food_entry, field, value)
    
    await food_entry.save()
    
    return FoodEntryResponse(
        id=str(food_entry.id),
        food_name=food_entry.food_name,
        quantity=food_entry.quantity,
        unit=food_entry.unit,
        meal_type=food_entry.meal_type,
        category=food_entry.category,
        nutrition=food_entry.nutrition,
        notes=food_entry.notes,
        date=food_entry.date,
        created_at=food_entry.created_at
    )

@router.put("/water/{water_id}", response_model=WaterEntryResponse)
async def update_water_entry(water_id: str, water_data: WaterEntryCreate, current_user: User = Depends(get_current_active_user)):
    """Actualizar entrada de agua"""
    water_entry = await WaterEntry.get(water_id)
    
    if not water_entry or water_entry.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada de agua no encontrada"
        )
    
    # Actualizar campos
    water_entry.amount = water_data.amount
    await water_entry.save()
    
    return WaterEntryResponse(
        id=str(water_entry.id),
        amount=water_entry.amount,
        date=water_entry.date,
        created_at=water_entry.created_at
    )

@router.delete("/food/{food_id}")
async def delete_food_entry(food_id: str, current_user: User = Depends(get_current_active_user)):
    """Eliminar entrada de comida"""
    food_entry = await FoodEntry.get(food_id)
    
    if not food_entry or food_entry.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada de comida no encontrada"
        )
    
    await food_entry.delete()
    return {"message": "Entrada de comida eliminada exitosamente"}

@router.delete("/water/{water_id}")
async def delete_water_entry(water_id: str, current_user: User = Depends(get_current_active_user)):
    """Eliminar entrada de agua"""
    water_entry = await WaterEntry.get(water_id)
    
    if not water_entry or water_entry.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada de agua no encontrada"
        )
    
    await water_entry.delete()
    return {"message": "Entrada de agua eliminada exitosamente"}

@router.get("/advice")
async def get_daily_nutrition_advice(
    target_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener consejos nutricionales basados en el consumo del día"""
    if not target_date:
        target_date = date.today()
    
    # Obtener resumen del día
    summary = await get_daily_nutrition_summary(target_date, current_user)
    
    # Generar consejos personalizados
    advice = await get_nutrition_advice(summary, current_user)
    
    return {
        "date": target_date,
        "advice": advice,
        "summary": summary
    }

@router.get("/goals", response_model=NutritionGoals)
async def get_nutrition_goals(current_user: User = Depends(get_current_active_user)):
    """Obtener metas nutricionales del usuario"""
    # Calcular metas basadas en el perfil del usuario
    goals = NutritionGoals()
    
    if current_user.profile:
        profile = current_user.profile
        
        # Cálculo básico de calorías (Harris-Benedict)
        if profile.age and profile.weight and profile.height:
            # Fórmula para hombres (asumiendo, se puede ajustar)
            bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
            
            # Factor de actividad
            activity_multipliers = {
                "sedentary": 1.2,
                "light": 1.375,
                "moderate": 1.55,
                "active": 1.725,
                "very_active": 1.9
            }
            
            multiplier = activity_multipliers.get(profile.activity_level.value, 1.55)
            daily_calories = bmr * multiplier
            
            # Ajustar según objetivo
            if profile.goal == "weight_loss":
                daily_calories -= 500  # Déficit de 500 cal
            elif profile.goal == "weight_gain":
                daily_calories += 500  # Superávit de 500 cal
            
            goals.daily_calories = round(daily_calories)
            goals.daily_protein = round(profile.weight * 2.2)  # 2.2g por kg
            goals.daily_carbs = round(daily_calories * 0.45 / 4)  # 45% de calorías
            goals.daily_fats = round(daily_calories * 0.25 / 9)  # 25% de calorías
            
            # Agua basada en peso
            goals.daily_water = round(profile.weight * 35)  # 35ml por kg
    
    return goals