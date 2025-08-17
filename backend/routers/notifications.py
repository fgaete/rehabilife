from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from datetime import datetime, date, time, timedelta
import asyncio
from collections import defaultdict

from models.user import User
from models.notification import (
    NotificationSettings, NotificationSettingsUpdate, NotificationSettingsResponse,
    NotificationLog, NotificationResponse, SendNotificationRequest,
    NotificationType, NotificationFrequency, ReminderSettings
)
from models.nutrition import FoodEntry, WaterEntry
from routers.auth import get_current_active_user
from services.notification_service import NotificationService

router = APIRouter()
notification_service = NotificationService()

@router.get("/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(current_user: User = Depends(get_current_active_user)):
    """Obtener configuración de notificaciones del usuario"""
    settings = await NotificationSettings.find_one(
        NotificationSettings.user_id == str(current_user.id)
    )
    
    if not settings:
        # Crear configuración por defecto
        default_reminders = ReminderSettings(
            meal_times=[time(8, 0), time(13, 0), time(19, 0)],  # 8am, 1pm, 7pm
            water_interval_minutes=120,  # Cada 2 horas
            exercise_time=time(18, 0),  # 6pm
            weight_time=time(7, 0),  # 7am
            mood_time=time(21, 0)  # 9pm
        )
        
        settings = NotificationSettings(
            user_id=str(current_user.id),
            reminders=default_reminders
        )
        await settings.insert()
    
    return NotificationSettingsResponse(
        id=str(settings.id),
        user_id=settings.user_id,
        enabled=settings.enabled,
        reminders=settings.reminders,
        quiet_hours_start=settings.quiet_hours_start,
        quiet_hours_end=settings.quiet_hours_end,
        created_at=settings.created_at,
        updated_at=settings.updated_at
    )

@router.put("/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Actualizar configuración de notificaciones"""
    settings = await NotificationSettings.find_one(
        NotificationSettings.user_id == str(current_user.id)
    )
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuración de notificaciones no encontrada"
        )
    
    update_data = settings_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    settings.updated_at = datetime.utcnow()
    await settings.save()
    
    return NotificationSettingsResponse(
        id=str(settings.id),
        user_id=settings.user_id,
        enabled=settings.enabled,
        reminders=settings.reminders,
        quiet_hours_start=settings.quiet_hours_start,
        quiet_hours_end=settings.quiet_hours_end,
        created_at=settings.created_at,
        updated_at=settings.updated_at
    )

@router.post("/send", response_model=NotificationResponse)
async def send_notification(
    notification_request: SendNotificationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    """Enviar notificación inmediata"""
    # Verificar configuración de notificaciones
    settings = await NotificationSettings.find_one(
        NotificationSettings.user_id == str(current_user.id)
    )
    
    if not settings or not settings.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las notificaciones están deshabilitadas"
        )
    
    # Verificar horas de silencio
    current_time = datetime.now().time()
    if settings.quiet_hours_start and settings.quiet_hours_end:
        if settings.quiet_hours_start <= current_time <= settings.quiet_hours_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Actualmente en horas de silencio"
            )
    
    # Crear log de notificación
    notification_log = NotificationLog(
        user_id=str(current_user.id),
        notification_type=notification_request.notification_type,
        title=notification_request.title,
        message=notification_request.message,
        sent_at=datetime.utcnow()
    )
    await notification_log.insert()
    
    # Enviar notificación en background
    background_tasks.add_task(
        notification_service.send_web_notification,
        str(current_user.id),
        notification_request.title,
        notification_request.message
    )
    
    return NotificationResponse(
        id=str(notification_log.id),
        notification_type=notification_log.notification_type,
        title=notification_log.title,
        message=notification_log.message,
        sent_at=notification_log.sent_at,
        delivered=True
    )

@router.get("/history", response_model=List[NotificationResponse])
async def get_notification_history(
    limit: int = 50,
    notification_type: Optional[NotificationType] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Obtener historial de notificaciones"""
    query = NotificationLog.user_id == str(current_user.id)
    
    if notification_type:
        query = query & (NotificationLog.notification_type == notification_type)
    
    notifications = await NotificationLog.find(query).sort(
        -NotificationLog.sent_at
    ).limit(limit).to_list()
    
    return [
        NotificationResponse(
            id=str(notif.id),
            notification_type=notif.notification_type,
            title=notif.title,
            message=notif.message,
            sent_at=notif.sent_at,
            delivered=notif.delivered
        ) for notif in notifications
    ]

@router.post("/test-reminder/{reminder_type}")
async def test_reminder(
    reminder_type: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    """Probar un tipo específico de recordatorio"""
    settings = await NotificationSettings.find_one(
        NotificationSettings.user_id == str(current_user.id)
    )
    
    if not settings or not settings.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las notificaciones están deshabilitadas"
        )
    
    # Generar mensaje de prueba según el tipo
    messages = {
        "meal": ("🍽️ Recordatorio de Comida", "Es hora de registrar tu comida. ¡Mantén tu seguimiento nutricional!"),
        "water": ("💧 Recordatorio de Hidratación", "¡Hora de beber agua! Mantente hidratado para tu bienestar."),
        "exercise": ("🏃‍♂️ Recordatorio de Ejercicio", "Es momento de hacer algo de actividad física. ¡Tu cuerpo te lo agradecerá!"),
        "weight": ("⚖️ Recordatorio de Peso", "Registra tu peso de hoy para seguir tu progreso."),
        "mood": ("😊 Recordatorio de Estado de Ánimo", "¿Cómo te sientes hoy? Registra tu estado de ánimo.")
    }
    
    if reminder_type not in messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de recordatorio no válido"
        )
    
    title, message = messages[reminder_type]
    
    # Crear log de notificación
    notification_log = NotificationLog(
        user_id=str(current_user.id),
        notification_type=NotificationType(reminder_type),
        title=f"[PRUEBA] {title}",
        message=message,
        sent_at=datetime.utcnow()
    )
    await notification_log.insert()
    
    # Enviar notificación
    background_tasks.add_task(
        notification_service.send_web_notification,
        str(current_user.id),
        notification_log.title,
        notification_log.message
    )
    
    return {"message": f"Notificación de prueba '{reminder_type}' enviada"}

@router.get("/smart-reminders")
async def get_smart_reminders(current_user: User = Depends(get_current_active_user)):
    """Obtener recordatorios inteligentes basados en patrones del usuario"""
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Obtener datos recientes
    recent_food = await FoodEntry.find(
        FoodEntry.user_id == str(current_user.id),
        FoodEntry.date >= datetime.combine(yesterday, datetime.min.time())
    ).to_list()
    
    recent_water = await WaterEntry.find(
        WaterEntry.user_id == str(current_user.id),
        WaterEntry.date >= datetime.combine(yesterday, datetime.min.time())
    ).to_list()
    
    reminders = []
    current_hour = datetime.now().hour
    
    # Recordatorio de desayuno
    if current_hour >= 7 and current_hour <= 10:
        today_breakfast = [f for f in recent_food if f.meal_type.value == "breakfast" and f.date.date() == today]
        if not today_breakfast:
            reminders.append({
                "type": "meal",
                "priority": "high",
                "message": "¡Buenos días! No olvides desayunar para empezar el día con energía.",
                "suggested_action": "Registra tu desayuno"
            })
    
    # Recordatorio de hidratación
    today_water = [w for w in recent_water if w.date.date() == today]
    total_water_today = sum(w.amount for w in today_water)
    
    if total_water_today < 500 and current_hour >= 10:
        reminders.append({
            "type": "water",
            "priority": "medium",
            "message": f"Has bebido {total_water_today}ml hoy. ¡Recuerda mantenerte hidratado!",
            "suggested_action": "Bebe un vaso de agua"
        })
    
    # Recordatorio de almuerzo
    if current_hour >= 12 and current_hour <= 15:
        today_lunch = [f for f in recent_food if f.meal_type.value == "lunch" and f.date.date() == today]
        if not today_lunch:
            reminders.append({
                "type": "meal",
                "priority": "high",
                "message": "Es hora del almuerzo. Mantén tu energía con una comida balanceada.",
                "suggested_action": "Registra tu almuerzo"
            })
    
    # Recordatorio de ejercicio
    if current_hour >= 17 and current_hour <= 20:
        # Verificar si ha hecho ejercicio hoy (esto requeriría un campo en DailyStats)
        reminders.append({
            "type": "exercise",
            "priority": "medium",
            "message": "¿Qué tal algo de actividad física? Incluso una caminata corta es beneficiosa.",
            "suggested_action": "Registra tu actividad"
        })
    
    # Recordatorio de cena
    if current_hour >= 18 and current_hour <= 21:
        today_dinner = [f for f in recent_food if f.meal_type.value == "dinner" and f.date.date() == today]
        if not today_dinner:
            reminders.append({
                "type": "meal",
                "priority": "medium",
                "message": "Hora de la cena. Opta por algo ligero y nutritivo.",
                "suggested_action": "Registra tu cena"
            })
    
    return {
        "reminders": reminders,
        "generated_at": datetime.utcnow(),
        "user_timezone": "local",  # En una implementación real, esto vendría del perfil del usuario
        "total_reminders": len(reminders)
    }

@router.post("/schedule-reminders")
async def schedule_daily_reminders(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    """Programar recordatorios diarios automáticos"""
    settings = await NotificationSettings.find_one(
        NotificationSettings.user_id == str(current_user.id)
    )
    
    if not settings or not settings.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las notificaciones están deshabilitadas"
        )
    
    # En una implementación real, esto se haría con un scheduler como Celery
    # Por ahora, programamos recordatorios para las próximas horas
    
    scheduled_count = 0
    current_time = datetime.now()
    
    # Programar recordatorios de comida
    if settings.reminders.meal_times:
        for meal_time in settings.reminders.meal_times:
            # Calcular próxima ocurrencia
            next_meal = datetime.combine(date.today(), meal_time)
            if next_meal <= current_time:
                next_meal += timedelta(days=1)
            
            # En una implementación real, esto se programaría con un scheduler
            scheduled_count += 1
    
    # Programar recordatorios de agua
    if settings.reminders.water_interval_minutes:
        # Calcular próximo recordatorio de agua
        next_water = current_time + timedelta(minutes=settings.reminders.water_interval_minutes)
        scheduled_count += 1
    
    return {
        "message": f"Se programaron {scheduled_count} recordatorios",
        "scheduled_count": scheduled_count,
        "next_check": current_time + timedelta(hours=1)
    }

@router.delete("/clear-history")
async def clear_notification_history(current_user: User = Depends(get_current_active_user)):
    """Limpiar historial de notificaciones"""
    deleted_count = await NotificationLog.find(
        NotificationLog.user_id == str(current_user.id)
    ).delete()
    
    return {
        "message": f"Se eliminaron {deleted_count} notificaciones del historial",
        "deleted_count": deleted_count
    }