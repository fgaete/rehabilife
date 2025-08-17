import os
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Configuración de la aplicación usando variables de entorno"""
    
    # Configuración de la base de datos
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "rehabilife"
    
    # Configuración JWT
    secret_key: str = "your-super-secret-jwt-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Configuración del servidor
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Configuración CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    
    # Configuración de logging
    log_level: str = "INFO"
    
    # Configuración de notificaciones web push
    web_push_vapid_public_key: str = ""
    web_push_vapid_private_key: str = ""
    web_push_vapid_subject: str = "mailto:your-email@example.com"
    
    # Configuración de email
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    
    # Configuración de timezone
    timezone: str = "America/Santiago"
    
    def get_allowed_origins(self) -> List[str]:
        """Convierte la cadena de orígenes permitidos en una lista"""
        return [origin.strip() for origin in self.allowed_origins.split(',')]
    
    @field_validator('secret_key')
    @classmethod
    def validate_secret_key(cls, v):
        if v == "your-super-secret-jwt-key-change-this-in-production":
            import secrets
            return secrets.token_urlsafe(32)
        return v
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False
    }

# Instancia global de configuración
settings = Settings()

# Configuración de logging
import logging

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log') if not settings.debug else logging.NullHandler()
    ]
)

logger = logging.getLogger(__name__)