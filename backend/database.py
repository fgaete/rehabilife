from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from config import settings, logger
from models.user import User
from models.nutrition import FoodEntry, WaterEntry
from models.analytics import DailyStats
from models.notification import NotificationSettings, NotificationLog

async def init_db():
    """Inicializar conexión a MongoDB y Beanie"""
    try:
        # Crear cliente de MongoDB
        client = AsyncIOMotorClient(settings.mongodb_url)
        database = client[settings.database_name]
        
        # Verificar conexión
        await client.admin.command('ping')
        logger.info(f"Conexión exitosa a MongoDB: {settings.mongodb_url}")
        
        # Inicializar Beanie con los modelos
        await init_beanie(
            database=database,
            document_models=[
                User,
                FoodEntry,
                WaterEntry,
                DailyStats,
                NotificationSettings,
                NotificationLog
            ]
        )
        
        logger.info(f"Beanie inicializado con base de datos: {settings.database_name}")
        
    except Exception as e:
        logger.error(f"Error conectando a MongoDB: {str(e)}")
        raise

async def close_db():
    """Cerrar conexión a MongoDB"""
    global client
    if client:
        client.close()
        print("Conexión a MongoDB cerrada")

def get_database():
    """Obtener instancia de la base de datos"""
    return database