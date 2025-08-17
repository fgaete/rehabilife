from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime

from models.user import User, UserResponse, UserUpdate
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """Obtener perfil del usuario actual"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        profile=current_user.profile,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )

@router.put("/profile", response_model=UserResponse)
async def update_user_profile(user_update: UserUpdate, current_user: User = Depends(get_current_active_user)):
    """Actualizar perfil del usuario"""
    update_data = user_update.dict(exclude_unset=True)
    
    if update_data:
        # Actualizar campos
        for field, value in update_data.items():
            setattr(current_user, field, value)
        
        current_user.updated_at = datetime.utcnow()
        await current_user.save()
    
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        profile=current_user.profile,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )

@router.delete("/profile")
async def delete_user_account(current_user: User = Depends(get_current_active_user)):
    """Eliminar cuenta de usuario (desactivar)"""
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    
    return {"message": "Cuenta desactivada exitosamente"}

@router.post("/deactivate")
async def deactivate_account(current_user: User = Depends(get_current_active_user)):
    """Desactivar cuenta temporalmente"""
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    
    return {"message": "Cuenta desactivada temporalmente"}

@router.post("/reactivate")
async def reactivate_account(current_user: User = Depends(get_current_active_user)):
    """Reactivar cuenta"""
    current_user.is_active = True
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    
    return {"message": "Cuenta reactivada exitosamente"}

@router.get("/stats")
async def get_user_stats(current_user: User = Depends(get_current_active_user)):
    """Obtener estadísticas básicas del usuario"""
    from models.nutrition import FoodEntry, WaterEntry
    from models.analytics import DailyStats
    from datetime import date, timedelta
    
    today = date.today()
    week_ago = today - timedelta(days=7)
    
    # Contar entradas de la última semana
    food_entries_count = await FoodEntry.find(
        FoodEntry.user_id == str(current_user.id),
        FoodEntry.date >= datetime.combine(week_ago, datetime.min.time())
    ).count()
    
    water_entries_count = await WaterEntry.find(
        WaterEntry.user_id == str(current_user.id),
        WaterEntry.date >= datetime.combine(week_ago, datetime.min.time())
    ).count()
    
    daily_stats_count = await DailyStats.find(
        DailyStats.user_id == str(current_user.id),
        DailyStats.date >= week_ago
    ).count()
    
    # Calcular días desde registro
    days_since_registration = (datetime.utcnow() - current_user.created_at).days
    
    return {
        "user_id": str(current_user.id),
        "days_since_registration": days_since_registration,
        "last_week_stats": {
            "food_entries": food_entries_count,
            "water_entries": water_entries_count,
            "daily_stats_logged": daily_stats_count,
            "consistency_score": round((daily_stats_count / 7) * 100, 1)
        },
        "profile_completion": {
            "has_full_name": bool(current_user.full_name),
            "has_age": bool(current_user.profile and current_user.profile.age),
            "has_weight": bool(current_user.profile and current_user.profile.weight),
            "has_height": bool(current_user.profile and current_user.profile.height),
            "has_goal": bool(current_user.profile and current_user.profile.goal),
            "completion_percentage": 0  # Se calculará en el frontend
        }
    }