from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings, logger
from database import init_db
from routers import auth, users, nutrition, analytics, notifications

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar base de datos al inicio
    logger.info("Iniciando RehabiLife API...")
    await init_db()
    logger.info("Base de datos inicializada correctamente")
    yield
    # Cleanup al cerrar (si es necesario)
    logger.info("Cerrando RehabiLife API...")

app = FastAPI(
    title="RehabiLife API",
    description="API para plataforma de rehabilitación y seguimiento de salud",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(nutrition.router, prefix="/api/nutrition", tags=["nutrition"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])

@app.get("/")
async def root():
    return {"message": "RehabiLife API está funcionando correctamente"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API funcionando correctamente"}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Iniciando servidor en {settings.host}:{settings.port}")
    uvicorn.run(
        app, 
        host=settings.host, 
        port=settings.port,
        log_level=settings.log_level.lower(),
        reload=settings.debug
    )