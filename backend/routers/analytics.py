from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
from collections import defaultdict

from models.user import User
from models.analytics import (
    DailyStats, DailyStatsCreate, DailyStatsUpdate, DailyStatsResponse,
    AnalyticsSummary, WeeklyTrend, MonthlyProgress, GoalProgress,
    AnalyticsRequest, TrendDirection, NutritionMetrics, ActivityMetrics
)
from models.nutrition import FoodEntry, WaterEntry
from routers.auth import get_current_active_user

router = APIRouter()

@router.post("/daily-stats", response_model=DailyStatsResponse)
async def create_daily_stats(stats_data: DailyStatsCreate, current_user: User = Depends(get_current_active_user)):
    """Crear o actualizar estadísticas diarias"""
    target_date = stats_data.date or date.today()
    
    # Buscar si ya existe una entrada para este día
    existing_stats = await DailyStats.find_one(
        DailyStats.user_id == str(current_user.id),
        DailyStats.date == target_date
    )
    
    if existing_stats:
        # Actualizar existente
        if stats_data.health_metrics:
            existing_stats.health_metrics = stats_data.health_metrics
        if stats_data.activity_metrics:
            # Combinar métricas de actividad existentes con las nuevas
            current_activity = existing_stats.activity_metrics or ActivityMetrics()
            new_activity = stats_data.activity_metrics
            
            existing_stats.activity_metrics = ActivityMetrics(
                gym_sessions=current_activity.gym_sessions + (new_activity.gym_sessions or 0),
                cardio_minutes=current_activity.cardio_minutes + (new_activity.cardio_minutes or 0),
                strength_training_minutes=current_activity.strength_training_minutes + (new_activity.strength_training_minutes or 0),
                work_minutes=current_activity.work_minutes + (new_activity.work_minutes or 0),
                leisure_minutes=current_activity.leisure_minutes + (new_activity.leisure_minutes or 0),
                rest_minutes=current_activity.rest_minutes + (new_activity.rest_minutes or 0),
                study_minutes=current_activity.study_minutes + (new_activity.study_minutes or 0),
                social_minutes=current_activity.social_minutes + (new_activity.social_minutes or 0),
                steps=new_activity.steps or current_activity.steps,
                calories_burned=(current_activity.calories_burned or 0) + (new_activity.calories_burned or 0)
            )
        if stats_data.notes:
            existing_stats.notes = stats_data.notes
        existing_stats.updated_at = datetime.utcnow()
        
        # Actualizar métricas nutricionales automáticamente
        nutrition_metrics = await _calculate_nutrition_metrics(str(current_user.id), target_date)
        existing_stats.nutrition_metrics = nutrition_metrics
        
        await existing_stats.save()
        daily_stats = existing_stats
    else:
        # Crear nuevo
        nutrition_metrics = await _calculate_nutrition_metrics(str(current_user.id), target_date)
        
        daily_stats = DailyStats(
            user_id=str(current_user.id),
            date=target_date,
            health_metrics=stats_data.health_metrics or {},
            nutrition_metrics=nutrition_metrics,
            activity_metrics=stats_data.activity_metrics or ActivityMetrics(),
            notes=stats_data.notes
        )
        await daily_stats.insert()
    
    return DailyStatsResponse(
        id=str(daily_stats.id),
        date=daily_stats.date,
        health_metrics=daily_stats.health_metrics,
        nutrition_metrics=daily_stats.nutrition_metrics,
        activity_metrics=daily_stats.activity_metrics,
        notes=daily_stats.notes,
        created_at=daily_stats.created_at,
        updated_at=daily_stats.updated_at
    )

@router.get("/daily-stats", response_model=List[DailyStatsResponse])
async def get_daily_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(30, le=90),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener estadísticas diarias con filtros"""
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    daily_stats = await DailyStats.find(
        DailyStats.user_id == str(current_user.id),
        DailyStats.date >= start_date,
        DailyStats.date <= end_date
    ).sort(-DailyStats.date).limit(limit).to_list()
    
    return [
        DailyStatsResponse(
            id=str(stats.id),
            date=stats.date,
            health_metrics=stats.health_metrics,
            nutrition_metrics=stats.nutrition_metrics,
            activity_metrics=stats.activity_metrics,
            notes=stats.notes,
            created_at=stats.created_at,
            updated_at=stats.updated_at
        ) for stats in daily_stats
    ]

@router.get("/daily-stats/{target_date}", response_model=DailyStatsResponse)
async def get_daily_stats_by_date(
    target_date: date,
    current_user: User = Depends(get_current_active_user)
):
    """Obtener estadísticas de un día específico"""
    daily_stats = await DailyStats.find_one(
        DailyStats.user_id == str(current_user.id),
        DailyStats.date == target_date
    )
    
    if not daily_stats:
        # Crear estadísticas automáticamente si no existen
        nutrition_metrics = await _calculate_nutrition_metrics(str(current_user.id), target_date)
        
        daily_stats = DailyStats(
            user_id=str(current_user.id),
            date=target_date,
            nutrition_metrics=nutrition_metrics
        )
        await daily_stats.insert()
    
    return DailyStatsResponse(
        id=str(daily_stats.id),
        date=daily_stats.date,
        health_metrics=daily_stats.health_metrics,
        nutrition_metrics=daily_stats.nutrition_metrics,
        activity_metrics=daily_stats.activity_metrics,
        notes=daily_stats.notes,
        created_at=daily_stats.created_at,
        updated_at=daily_stats.updated_at
    )

@router.delete("/daily-stats/{stats_id}")
async def delete_daily_stats(
    stats_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Eliminar estadísticas diarias"""
    try:
        # Buscar las estadísticas
        daily_stats = await DailyStats.get(stats_id)
        
        if not daily_stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Estadísticas no encontradas"
            )
        
        # Verificar que pertenezcan al usuario actual
        if daily_stats.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para eliminar estas estadísticas"
            )
        
        # Eliminar las estadísticas
        await daily_stats.delete()
        
        return {"message": "Estadísticas eliminadas correctamente"}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar estadísticas: {str(e)}"
        )

@router.put("/daily-stats/{stats_id}", response_model=DailyStatsResponse)
async def update_daily_stats(
    stats_id: str,
    stats_update: DailyStatsUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Actualizar estadísticas diarias"""
    daily_stats = await DailyStats.get(stats_id)
    
    if not daily_stats or daily_stats.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estadísticas no encontradas"
        )
    
    update_data = stats_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(daily_stats, field, value)
    
    daily_stats.updated_at = datetime.utcnow()
    await daily_stats.save()
    
    return DailyStatsResponse(
        id=str(daily_stats.id),
        date=daily_stats.date,
        health_metrics=daily_stats.health_metrics,
        nutrition_metrics=daily_stats.nutrition_metrics,
        activity_metrics=daily_stats.activity_metrics,
        notes=daily_stats.notes,
        created_at=daily_stats.created_at,
        updated_at=daily_stats.updated_at
    )

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener resumen analítico completo"""
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    # Obtener estadísticas del período
    daily_stats = await DailyStats.find(
        DailyStats.user_id == str(current_user.id),
        DailyStats.date >= start_date,
        DailyStats.date <= end_date
    ).sort(DailyStats.date).to_list()
    
    # Calcular tendencias semanales
    weekly_trends = await _calculate_weekly_trends(daily_stats)
    
    # Calcular progreso mensual
    monthly_progress = await _calculate_monthly_progress(daily_stats)
    
    # Generar logros y recomendaciones
    achievements = _generate_achievements(daily_stats, current_user)
    recommendations = _generate_recommendations(daily_stats, current_user)
    
    # Calcular métricas de consistencia
    consistency_metrics = _calculate_consistency_metrics(daily_stats, start_date, end_date)
    
    return AnalyticsSummary(
        user_id=str(current_user.id),
        period_start=start_date,
        period_end=end_date,
        weekly_trends=weekly_trends,
        monthly_progress=monthly_progress,
        achievements=achievements,
        recommendations=recommendations,
        consistency_metrics=consistency_metrics
    )

@router.get("/goals-progress", response_model=List[GoalProgress])
async def get_goals_progress(current_user: User = Depends(get_current_active_user)):
    """Obtener progreso hacia las metas del usuario"""
    goals_progress = []
    
    if not current_user.profile:
        return goals_progress
    
    # Obtener estadísticas recientes
    recent_stats = await DailyStats.find(
        DailyStats.user_id == str(current_user.id),
        DailyStats.date >= date.today() - timedelta(days=7)
    ).sort(-DailyStats.date).limit(7).to_list()
    
    if not recent_stats:
        return goals_progress
    
    # Progreso de peso
    if current_user.profile.target_weight and current_user.profile.weight:
        latest_weight = None
        for stats in recent_stats:
            if stats.health_metrics.weight:
                latest_weight = stats.health_metrics.weight
                break
        
        if latest_weight:
            target = current_user.profile.target_weight
            current = latest_weight
            start_weight = current_user.profile.weight
            
            if target != start_weight:
                progress = abs(start_weight - current) / abs(start_weight - target) * 100
                progress = min(100, max(0, progress))
                
                goals_progress.append(GoalProgress(
                    goal_type="weight",
                    target_value=target,
                    current_value=current,
                    progress_percentage=round(progress, 1),
                    is_on_track=progress > 0
                ))
    
    return goals_progress

# Funciones auxiliares
async def _calculate_nutrition_metrics(user_id: str, target_date: date) -> NutritionMetrics:
    """Calcular métricas nutricionales para un día específico"""
    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.max.time())
    
    # Obtener entradas de comida
    food_entries = await FoodEntry.find(
        FoodEntry.user_id == user_id,
        FoodEntry.date >= start_datetime,
        FoodEntry.date <= end_datetime
    ).to_list()
    
    # Obtener entradas de agua
    water_entries = await WaterEntry.find(
        WaterEntry.user_id == user_id,
        WaterEntry.date >= start_datetime,
        WaterEntry.date <= end_datetime
    ).to_list()
    
    # Calcular totales
    calories = sum(entry.nutrition.calories for entry in food_entries)
    protein = sum(entry.nutrition.protein for entry in food_entries)
    carbs = sum(entry.nutrition.carbs for entry in food_entries)
    fats = sum(entry.nutrition.fats for entry in food_entries)
    water = sum(entry.amount for entry in water_entries)
    
    # Contar alcohol
    alcohol_units = sum(
        entry.quantity for entry in food_entries 
        if entry.category.value == "alcohol"
    )
    
    return NutritionMetrics(
        calories_consumed=calories,
        protein_consumed=protein,
        carbs_consumed=carbs,
        fats_consumed=fats,
        water_consumed=water,
        meals_logged=len(food_entries),
        alcohol_units=alcohol_units
    )

async def _calculate_weekly_trends(daily_stats: List[DailyStats]) -> List[WeeklyTrend]:
    """Calcular tendencias semanales"""
    if len(daily_stats) < 14:  # Necesitamos al menos 2 semanas
        return []
    
    # Dividir en dos semanas
    mid_point = len(daily_stats) // 2
    first_week = daily_stats[:mid_point]
    second_week = daily_stats[mid_point:]
    
    trends = []
    
    # Tendencia de peso
    first_week_weights = [s.health_metrics.weight for s in first_week if s.health_metrics.weight]
    second_week_weights = [s.health_metrics.weight for s in second_week if s.health_metrics.weight]
    
    if first_week_weights and second_week_weights:
        avg_first = sum(first_week_weights) / len(first_week_weights)
        avg_second = sum(second_week_weights) / len(second_week_weights)
        change = ((avg_second - avg_first) / avg_first) * 100
        
        direction = TrendDirection.UP if change > 1 else TrendDirection.DOWN if change < -1 else TrendDirection.STABLE
        
        trends.append(WeeklyTrend(
            metric_name="weight",
            current_value=avg_second,
            previous_value=avg_first,
            change_percentage=round(change, 1),
            direction=direction
        ))
    
    return trends

async def _calculate_monthly_progress(daily_stats: List[DailyStats]) -> List[MonthlyProgress]:
    """Calcular progreso mensual"""
    # Agrupar por mes
    monthly_data = defaultdict(list)
    
    for stats in daily_stats:
        month_key = stats.date.strftime("%Y-%m")
        monthly_data[month_key].append(stats)
    
    progress = []
    
    for month, stats_list in monthly_data.items():
        if len(stats_list) < 5:  # Necesitamos datos suficientes
            continue
        
        # Calcular promedios
        weights = [s.health_metrics.weight for s in stats_list if s.health_metrics.weight]
        calories = [s.nutrition_metrics.calories_consumed for s in stats_list]
        proteins = [s.nutrition_metrics.protein_consumed for s in stats_list]
        
        weight_change = None
        if len(weights) >= 2:
            weight_change = weights[-1] - weights[0]
        
        avg_calories = sum(calories) / len(calories) if calories else 0
        avg_protein = sum(proteins) / len(proteins) if proteins else 0
        
        # Calcular consistencia (días con datos / días del mes)
        consistency = (len(stats_list) / 30) * 100  # Aproximado
        
        progress.append(MonthlyProgress(
            month=month,
            weight_change=weight_change,
            avg_calories=round(avg_calories, 1) if avg_calories else None,
            avg_protein=round(avg_protein, 1) if avg_protein else None,
            gym_sessions=sum(s.activity_metrics.gym_sessions for s in stats_list),
            consistency_score=round(consistency, 1)
        ))
    
    return progress

def _generate_achievements(daily_stats: List[DailyStats], user: User) -> List[str]:
    """Generar lista de logros"""
    achievements = []
    
    if len(daily_stats) >= 7:
        achievements.append("¡7 días consecutivos registrando datos!")
    
    if len(daily_stats) >= 30:
        achievements.append("¡Un mes completo de seguimiento!")
    
    # Verificar consistencia en hidratación
    well_hydrated_days = sum(
        1 for stats in daily_stats 
        if stats.nutrition_metrics.water_consumed >= 2000
    )
    
    if well_hydrated_days >= len(daily_stats) * 0.8:
        achievements.append("¡Excelente hidratación este período!")
    
    return achievements

def _generate_recommendations(daily_stats: List[DailyStats], user: User) -> List[str]:
    """Generar recomendaciones personalizadas"""
    recommendations = []
    
    if not daily_stats:
        return ["Comienza registrando tus comidas y estadísticas diarias."]
    
    # Analizar hidratación
    avg_water = sum(s.nutrition_metrics.water_consumed for s in daily_stats) / len(daily_stats)
    if avg_water < 1500:
        recommendations.append("Intenta beber más agua diariamente. Tu promedio está por debajo del recomendado.")
    
    # Analizar proteínas
    avg_protein = sum(s.nutrition_metrics.protein_consumed for s in daily_stats) / len(daily_stats)
    if user.profile and user.profile.weight and avg_protein < user.profile.weight * 1.5:
        recommendations.append("Considera aumentar tu consumo de proteínas para mejor recuperación muscular.")
    
    # Analizar consistencia
    if len(daily_stats) < 20:  # Menos de 20 días en el último mes
        recommendations.append("Trata de ser más consistente con el registro diario de tus comidas y estadísticas.")
    
    return recommendations

def _calculate_consistency_metrics(daily_stats: List[DailyStats], start_date: date, end_date: date) -> dict:
    """Calcular métricas de consistencia"""
    total_days = (end_date - start_date).days + 1
    logged_days = len(daily_stats)
    
    # Días con comidas registradas
    days_with_meals = sum(1 for stats in daily_stats if stats.nutrition_metrics.meals_logged > 0)
    
    # Días con agua registrada
    days_with_water = sum(1 for stats in daily_stats if stats.nutrition_metrics.water_consumed > 0)
    
    # Días con métricas de salud
    days_with_health = sum(
        1 for stats in daily_stats 
        if any([
            stats.health_metrics.weight,
            stats.health_metrics.energy_level,
            stats.health_metrics.mood
        ])
    )
    
    return {
        "overall_consistency": round((logged_days / total_days) * 100, 1),
        "meal_logging_consistency": round((days_with_meals / total_days) * 100, 1),
        "water_logging_consistency": round((days_with_water / total_days) * 100, 1),
        "health_metrics_consistency": round((days_with_health / total_days) * 100, 1),
        "total_days_in_period": total_days,
        "days_with_data": logged_days
    }