# RehabiLife Backend

API backend para la plataforma de rehabilitación y seguimiento de salud RehabiLife, construida con FastAPI, MongoDB y Python.

## 🚀 Características

- **Autenticación JWT**: Sistema de autenticación seguro sin dependencias externas
- **Seguimiento Nutricional**: Registro de comidas, hidratación y análisis nutricional
- **Consejos Inteligentes**: Sistema de recomendaciones basado en patrones de consumo
- **Analytics Locales**: Dashboard de estadísticas y progreso personal
- **Notificaciones Web**: Recordatorios personalizables para comidas, agua y ejercicio
- **Base de Datos Local**: MongoDB para almacenamiento completamente local

## 📋 Requisitos Previos

- **Python 3.8+**
- **MongoDB 4.4+**
- **pip** (gestor de paquetes de Python)

### Instalación de MongoDB en macOS

```bash
# Instalar MongoDB usando Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB como servicio
brew services start mongodb/brew/mongodb-community

# Verificar que MongoDB esté ejecutándose
mongosh --eval "db.runCommand('ping')"
```

### Instalación de MongoDB en Linux (Ubuntu/Debian)

```bash
# Importar clave pública de MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Agregar repositorio
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Instalar MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 🛠️ Instalación

### Opción 1: Script Automático (Recomendado)

```bash
# Navegar al directorio del backend
cd backend

# Ejecutar script de inicio (verifica dependencias e inicia el servidor)
python start.py
```

### Opción 2: Instalación Manual

```bash
# 1. Navegar al directorio del backend
cd backend

# 2. Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 5. Iniciar el servidor
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## ⚙️ Configuración

El archivo `.env` contiene todas las configuraciones necesarias:

```env
# Base de datos
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=rehabilife

# Seguridad JWT
SECRET_KEY=tu-clave-secreta-muy-segura
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Servidor
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS (para desarrollo con React)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 🏃‍♂️ Uso

### Iniciar el Servidor

```bash
# Usando el script de inicio
python start.py

# O directamente con uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Acceder a la API

- **Servidor**: http://localhost:8000
- **Documentación Interactiva**: http://localhost:8000/docs
- **Documentación ReDoc**: http://localhost:8000/redoc

## 📚 Endpoints Principales

### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener información del usuario actual

### Usuarios
- `GET /users/profile` - Obtener perfil del usuario
- `PUT /users/profile` - Actualizar perfil del usuario
- `GET /users/stats` - Obtener estadísticas básicas del usuario

### Nutrición
- `POST /nutrition/food` - Registrar comida
- `POST /nutrition/water` - Registrar agua
- `GET /nutrition/entries` - Obtener entradas de nutrición
- `GET /nutrition/daily-summary` - Resumen nutricional diario
- `GET /nutrition/advice` - Obtener consejos nutricionales

### Analytics
- `GET /analytics/summary` - Resumen analítico completo
- `GET /analytics/daily-stats` - Estadísticas diarias
- `POST /analytics/daily-stats` - Crear/actualizar estadísticas diarias

### Notificaciones
- `GET /notifications/settings` - Configuración de notificaciones
- `PUT /notifications/settings` - Actualizar configuración
- `POST /notifications/send` - Enviar notificación
- `GET /notifications/smart-reminders` - Recordatorios inteligentes

## 🗂️ Estructura del Proyecto

```
backend/
├── main.py                 # Aplicación principal FastAPI
├── config.py              # Configuración centralizada
├── database.py            # Configuración de MongoDB
├── start.py               # Script de inicio automático
├── requirements.txt       # Dependencias de Python
├── .env.example          # Ejemplo de variables de entorno
├── models/               # Modelos de datos
│   ├── user.py
│   ├── nutrition.py
│   ├── analytics.py
│   └── notification.py
├── routers/              # Endpoints de la API
│   ├── auth.py
│   ├── users.py
│   ├── nutrition.py
│   ├── analytics.py
│   └── notifications.py
└── services/             # Lógica de negocio
    ├── nutrition_advice.py
    └── notification_service.py
```

## 🧪 Desarrollo

### Ejecutar en Modo Desarrollo

```bash
# Con recarga automática
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Con logs detallados
uvicorn main:app --reload --log-level debug
```

### Variables de Entorno para Desarrollo

```env
DEBUG=True
LOG_LEVEL=DEBUG
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 🔧 Solución de Problemas

### MongoDB no se conecta

```bash
# Verificar que MongoDB esté ejecutándose
brew services list | grep mongodb
# O en Linux:
sudo systemctl status mongod

# Iniciar MongoDB si no está ejecutándose
brew services start mongodb/brew/mongodb-community
# O en Linux:
sudo systemctl start mongod
```

### Error de dependencias

```bash
# Actualizar pip
pip install --upgrade pip

# Reinstalar dependencias
pip install -r requirements.txt --force-reinstall
```

### Puerto 8000 en uso

```bash
# Cambiar puerto en .env
PORT=8001

# O especificar puerto al iniciar
uvicorn main:app --port 8001
```

## 🚀 Producción

Para despliegue en producción:

1. **Cambiar configuraciones de seguridad**:
   ```env
   DEBUG=False
   SECRET_KEY=clave-super-segura-generada-aleatoriamente
   ```

2. **Usar servidor WSGI**:
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

3. **Configurar proxy reverso** (Nginx, Apache, etc.)

4. **Configurar MongoDB con autenticación**

## 📝 Notas

- La aplicación está diseñada para uso local y personal
- No requiere servicios externos como Firebase o Google Auth
- Todos los datos se almacenan localmente en MongoDB
- Las notificaciones son web-based (no push notifications externas)

## 🤝 Contribución

Este es un proyecto personal de rehabilitación. Las mejoras y sugerencias son bienvenidas.

## 📄 Licencia

Proyecto personal - Uso libre para fines de rehabilitación y bienestar.