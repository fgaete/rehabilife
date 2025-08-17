import asyncio
import json
from typing import Dict, List, Optional
from datetime import datetime, time, timedelta
import logging
from collections import defaultdict

from models.notification import NotificationSettings, NotificationLog, NotificationType
from models.user import User

logger = logging.getLogger(__name__)

class NotificationService:
    """Servicio para manejar notificaciones web y recordatorios"""
    
    def __init__(self):
        # En una implementación real, aquí se configurarían servicios como:
        # - Web Push notifications
        # - Email service
        # - SMS service
        # - WebSocket connections para notificaciones en tiempo real
        self.active_connections: Dict[str, List] = defaultdict(list)
        self.notification_queue: List[Dict] = []
        
    async def send_web_notification(self, user_id: str, title: str, message: str, data: Optional[Dict] = None):
        """Enviar notificación web al usuario"""
        try:
            notification_data = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data or {}
            }
            
            # En una implementación real, aquí se enviaría la notificación
            # usando Web Push API, WebSockets, etc.
            
            # Por ahora, solo registramos la notificación
            logger.info(f"Notificación enviada a usuario {user_id}: {title}")
            
            # Simular envío exitoso
            await self._log_notification_sent(user_id, title, message, True)
            
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación a {user_id}: {str(e)}")
            await self._log_notification_sent(user_id, title, message, False)
            return False
    
    async def send_reminder_notification(self, user_id: str, reminder_type: NotificationType, custom_message: Optional[str] = None):
        """Enviar notificación de recordatorio específica"""
        # Mensajes predefinidos para cada tipo de recordatorio
        reminder_messages = {
            NotificationType.MEAL: {
                "title": "🍽️ Recordatorio de Comida",
                "message": custom_message or "Es hora de registrar tu comida. ¡Mantén tu seguimiento nutricional!"
            },
            NotificationType.WATER: {
                "title": "💧 Recordatorio de Hidratación",
                "message": custom_message or "¡Hora de beber agua! Mantente hidratado para tu bienestar."
            },
            NotificationType.EXERCISE: {
                "title": "🏃‍♂️ Recordatorio de Ejercicio",
                "message": custom_message or "Es momento de hacer algo de actividad física. ¡Tu cuerpo te lo agradecerá!"
            },
            NotificationType.WEIGHT: {
                "title": "⚖️ Recordatorio de Peso",
                "message": custom_message or "Registra tu peso de hoy para seguir tu progreso."
            },
            NotificationType.MOOD: {
                "title": "😊 Recordatorio de Estado de Ánimo",
                "message": custom_message or "¿Cómo te sientes hoy? Registra tu estado de ánimo."
            }
        }
        
        if reminder_type not in reminder_messages:
            logger.warning(f"Tipo de recordatorio no reconocido: {reminder_type}")
            return False
        
        reminder_data = reminder_messages[reminder_type]
        
        return await self.send_web_notification(
            user_id,
            reminder_data["title"],
            reminder_data["message"],
            {"reminder_type": reminder_type.value}
        )
    
    async def schedule_daily_reminders(self, user_id: str):
        """Programar recordatorios diarios para un usuario"""
        try:
            # Obtener configuración de notificaciones del usuario
            settings = await NotificationSettings.find_one(
                NotificationSettings.user_id == user_id
            )
            
            if not settings or not settings.enabled:
                logger.info(f"Notificaciones deshabilitadas para usuario {user_id}")
                return
            
            current_time = datetime.now().time()
            scheduled_reminders = []
            
            # Programar recordatorios de comida
            if settings.reminders.meal_times:
                for meal_time in settings.reminders.meal_times:
                    if self._should_send_reminder(current_time, meal_time, settings):
                        scheduled_reminders.append({
                            "type": NotificationType.MEAL,
                            "time": meal_time,
                            "message": self._get_meal_message_by_time(meal_time)
                        })
            
            # Programar recordatorio de agua
            if settings.reminders.water_interval_minutes:
                # Calcular si es hora del recordatorio de agua
                if self._should_send_water_reminder(user_id, settings.reminders.water_interval_minutes):
                    scheduled_reminders.append({
                        "type": NotificationType.WATER,
                        "time": current_time,
                        "message": None
                    })
            
            # Programar recordatorio de ejercicio
            if settings.reminders.exercise_time:
                if self._should_send_reminder(current_time, settings.reminders.exercise_time, settings):
                    scheduled_reminders.append({
                        "type": NotificationType.EXERCISE,
                        "time": settings.reminders.exercise_time,
                        "message": None
                    })
            
            # Programar recordatorio de peso
            if settings.reminders.weight_time:
                if self._should_send_reminder(current_time, settings.reminders.weight_time, settings):
                    scheduled_reminders.append({
                        "type": NotificationType.WEIGHT,
                        "time": settings.reminders.weight_time,
                        "message": None
                    })
            
            # Programar recordatorio de estado de ánimo
            if settings.reminders.mood_time:
                if self._should_send_reminder(current_time, settings.reminders.mood_time, settings):
                    scheduled_reminders.append({
                        "type": NotificationType.MOOD,
                        "time": settings.reminders.mood_time,
                        "message": None
                    })
            
            # Enviar recordatorios programados
            for reminder in scheduled_reminders:
                await self.send_reminder_notification(
                    user_id,
                    reminder["type"],
                    reminder["message"]
                )
            
            logger.info(f"Programados {len(scheduled_reminders)} recordatorios para usuario {user_id}")
            return len(scheduled_reminders)
            
        except Exception as e:
            logger.error(f"Error programando recordatorios para usuario {user_id}: {str(e)}")
            return 0
    
    async def send_smart_advice_notification(self, user_id: str, advice: str, category: str = "advice"):
        """Enviar notificación con consejo inteligente"""
        title = "💡 Consejo Personalizado"
        
        # Personalizar título según la categoría
        category_titles = {
            "nutrition": "🥗 Consejo Nutricional",
            "hydration": "💧 Consejo de Hidratación",
            "exercise": "🏃‍♂️ Consejo de Ejercicio",
            "recovery": "😴 Consejo de Recuperación",
            "motivation": "💪 Motivación Diaria"
        }
        
        title = category_titles.get(category, title)
        
        return await self.send_web_notification(
            user_id,
            title,
            advice,
            {"category": category, "type": "smart_advice"}
        )
    
    async def send_achievement_notification(self, user_id: str, achievement: str):
        """Enviar notificación de logro"""
        return await self.send_web_notification(
            user_id,
            "🏆 ¡Nuevo Logro!",
            achievement,
            {"type": "achievement"}
        )
    
    async def send_goal_progress_notification(self, user_id: str, goal_type: str, progress: float, target: float):
        """Enviar notificación de progreso hacia meta"""
        progress_percentage = (progress / target) * 100 if target > 0 else 0
        
        if progress_percentage >= 100:
            message = f"¡Felicitaciones! Has alcanzado tu meta de {goal_type}."
            title = "🎯 ¡Meta Alcanzada!"
        elif progress_percentage >= 75:
            message = f"¡Casi lo logras! Estás al {progress_percentage:.1f}% de tu meta de {goal_type}."
            title = "🔥 ¡Casi Ahí!"
        elif progress_percentage >= 50:
            message = f"Buen progreso: {progress_percentage:.1f}% de tu meta de {goal_type} completada."
            title = "📈 Buen Progreso"
        else:
            message = f"Sigue adelante: {progress_percentage:.1f}% de tu meta de {goal_type}."
            title = "💪 ¡Sigue Así!"
        
        return await self.send_web_notification(
            user_id,
            title,
            message,
            {
                "type": "goal_progress",
                "goal_type": goal_type,
                "progress": progress,
                "target": target,
                "percentage": progress_percentage
            }
        )
    
    def _should_send_reminder(self, current_time: time, reminder_time: time, settings: NotificationSettings) -> bool:
        """Determinar si se debe enviar un recordatorio"""
        # Verificar horas de silencio
        if settings.quiet_hours_start and settings.quiet_hours_end:
            if settings.quiet_hours_start <= current_time <= settings.quiet_hours_end:
                return False
        
        # Verificar si es aproximadamente la hora del recordatorio (±15 minutos)
        current_minutes = current_time.hour * 60 + current_time.minute
        reminder_minutes = reminder_time.hour * 60 + reminder_time.minute
        
        return abs(current_minutes - reminder_minutes) <= 15
    
    async def _should_send_water_reminder(self, user_id: str, interval_minutes: int) -> bool:
        """Determinar si es hora de enviar recordatorio de agua"""
        try:
            # Buscar la última notificación de agua enviada
            last_water_notification = await NotificationLog.find(
                NotificationLog.user_id == user_id,
                NotificationLog.notification_type == NotificationType.WATER
            ).sort(-NotificationLog.sent_at).limit(1).to_list()
            
            if not last_water_notification:
                return True  # Primera notificación del día
            
            last_sent = last_water_notification[0].sent_at
            time_since_last = datetime.utcnow() - last_sent
            
            return time_since_last.total_seconds() >= (interval_minutes * 60)
            
        except Exception as e:
            logger.error(f"Error verificando recordatorio de agua: {str(e)}")
            return False
    
    def _get_meal_message_by_time(self, meal_time: time) -> str:
        """Obtener mensaje personalizado según la hora de la comida"""
        hour = meal_time.hour
        
        if 5 <= hour <= 10:
            return "¡Buenos días! Es hora del desayuno. Comienza el día con energía."
        elif 11 <= hour <= 15:
            return "Es hora del almuerzo. Mantén tu energía con una comida balanceada."
        elif 16 <= hour <= 18:
            return "¿Qué tal un snack saludable? Mantén tu energía estable."
        elif 19 <= hour <= 22:
            return "Hora de la cena. Opta por algo ligero y nutritivo."
        else:
            return "Es hora de registrar tu comida. ¡Mantén tu seguimiento nutricional!"
    
    async def _log_notification_sent(self, user_id: str, title: str, message: str, delivered: bool):
        """Registrar notificación enviada en la base de datos"""
        try:
            # En una implementación real, esto se haría automáticamente
            # desde el router de notificaciones
            pass
        except Exception as e:
            logger.error(f"Error registrando notificación: {str(e)}")
    
    async def get_notification_stats(self, user_id: str, days: int = 7) -> Dict:
        """Obtener estadísticas de notificaciones para un usuario"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            notifications = await NotificationLog.find(
                NotificationLog.user_id == user_id,
                NotificationLog.sent_at >= start_date
            ).to_list()
            
            stats = {
                "total_sent": len(notifications),
                "delivered": sum(1 for n in notifications if n.delivered),
                "by_type": defaultdict(int),
                "by_day": defaultdict(int)
            }
            
            for notification in notifications:
                stats["by_type"][notification.notification_type.value] += 1
                day_key = notification.sent_at.strftime("%Y-%m-%d")
                stats["by_day"][day_key] += 1
            
            stats["delivery_rate"] = (stats["delivered"] / stats["total_sent"]) * 100 if stats["total_sent"] > 0 else 0
            
            return dict(stats)
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de notificaciones: {str(e)}")
            return {}
    
    async def cleanup_old_notifications(self, days_to_keep: int = 30):
        """Limpiar notificaciones antiguas"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
            
            deleted_count = await NotificationLog.find(
                NotificationLog.sent_at < cutoff_date
            ).delete()
            
            logger.info(f"Eliminadas {deleted_count} notificaciones antiguas")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error limpiando notificaciones antiguas: {str(e)}")
            return 0