from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    MEAL_REMINDER = "meal_reminder"
    WATER_REMINDER = "water_reminder"
    EXERCISE_REMINDER = "exercise_reminder"
    WEIGHT_CHECK = "weight_check"
    MOOD_CHECK = "mood_check"
    MOTIVATION = "motivation"
    ACHIEVEMENT = "achievement"
    WARNING = "warning"

class NotificationFrequency(str, Enum):
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    CUSTOM = "custom"

class ReminderSettings(BaseModel):
    enabled: bool = True
    time: str  # Format: "HH:MM" (24-hour format)
    frequency: NotificationFrequency = NotificationFrequency.DAILY
    custom_days: Optional[List[int]] = None  # 0=Monday, 6=Sunday
    message: Optional[str] = None

class NotificationSettings(Document):
    user_id: str = Field(..., unique=True, index=True)
    
    # Recordatorios de comidas
    breakfast_reminder: ReminderSettings = Field(default_factory=lambda: ReminderSettings(
        time="08:00", 
        message="¡Hora del desayuno! Recuerda incluir proteínas."
    ))
    lunch_reminder: ReminderSettings = Field(default_factory=lambda: ReminderSettings(
        time="13:00",
        message="¡Hora del almuerzo! Mantén el equilibrio nutricional."
    ))
    dinner_reminder: ReminderSettings = Field(default_factory=lambda: ReminderSettings(
        time="19:00",
        message="¡Hora de la cena! Opta por algo ligero y nutritivo."
    ))
    
    # Recordatorios de hidratación
    water_reminders: List[ReminderSettings] = Field(default_factory=lambda: [
        ReminderSettings(time="09:00", message="💧 ¡Hora de hidratarte!"),
        ReminderSettings(time="12:00", message="💧 ¡No olvides beber agua!"),
        ReminderSettings(time="15:00", message="💧 ¡Mantente hidratado!"),
        ReminderSettings(time="18:00", message="💧 ¡Un poco más de agua!"),
    ])
    
    # Recordatorios de ejercicio
    exercise_reminder: ReminderSettings = Field(default_factory=lambda: ReminderSettings(
        time="17:00",
        frequency=NotificationFrequency.CUSTOM,
        custom_days=[0, 2, 4],  # Lunes, Miércoles, Viernes
        message="💪 ¡Hora del gimnasio! Tu cuerpo te lo agradecerá."
    ))

    # Recordatorio de pesaje
    weight_check: ReminderSettings = Field(default_factory=lambda: ReminderSettings(
        time="07:00",
        frequency=NotificationFrequency.WEEKLY,
        custom_days=[0],  # Solo lunes
        message="📊 ¡Hora de registrar tu peso semanal!"
    ))

    mood_check: ReminderSettings = Field(default_factory=lambda: ReminderSettings(
        time="21:00",
        message="🌙 ¿Cómo te sientes hoy? Registra tu estado de ánimo."
    ))
    
    # Configuraciones generales
    motivational_messages: bool = True
    achievement_notifications: bool = True
    warning_notifications: bool = True
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "notification_settings"
        indexes = ["user_id"]

class NotificationLog(Document):
    user_id: str = Field(..., index=True)
    notification_type: NotificationType
    title: str
    message: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None
    is_read: bool = False
    metadata: Optional[Dict] = None
    
    class Settings:
        name = "notification_logs"
        indexes = [
            "user_id",
            "sent_at",
            "notification_type",
            "is_read"
        ]

# Schemas para requests/responses
class NotificationSettingsUpdate(BaseModel):
    breakfast_reminder: Optional[ReminderSettings] = None
    lunch_reminder: Optional[ReminderSettings] = None
    dinner_reminder: Optional[ReminderSettings] = None
    water_reminders: Optional[List[ReminderSettings]] = None
    exercise_reminder: Optional[ReminderSettings] = None
    weight_check: Optional[ReminderSettings] = None
    mood_check: Optional[ReminderSettings] = None
    motivational_messages: Optional[bool] = None
    achievement_notifications: Optional[bool] = None
    warning_notifications: Optional[bool] = None

class NotificationSettingsResponse(BaseModel):
    id: str
    user_id: str
    breakfast_reminder: ReminderSettings
    lunch_reminder: ReminderSettings
    dinner_reminder: ReminderSettings
    water_reminders: List[ReminderSettings]
    exercise_reminder: ReminderSettings
    weight_check: ReminderSettings
    mood_check: ReminderSettings
    motivational_messages: bool
    achievement_notifications: bool
    warning_notifications: bool
    created_at: datetime
    updated_at: datetime

class NotificationResponse(BaseModel):
    id: str
    notification_type: NotificationType
    title: str
    message: str
    sent_at: datetime
    is_read: bool
    read_at: Optional[datetime] = None

class SendNotificationRequest(BaseModel):
    notification_type: NotificationType
    title: str
    message: str
    metadata: Optional[Dict] = None

class MarkAsReadRequest(BaseModel):
    notification_ids: List[str]