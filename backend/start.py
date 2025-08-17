#!/usr/bin/env python3
"""
Script de inicio para RehabiLife Backend
Este script verifica las dependencias y inicia el servidor
"""

import subprocess
import sys
import os
from pathlib import Path

def check_python_version():
    """Verificar que la versión de Python sea compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Se requiere Python 3.8 o superior")
        print(f"Versión actual: {sys.version}")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    return True

def check_mongodb():
    """Verificar si MongoDB está instalado y ejecutándose"""
    try:
        # Verificar si mongod está instalado
        result = subprocess.run(['mongod', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("✅ MongoDB está instalado")
        else:
            print("❌ MongoDB no está instalado")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ MongoDB no está instalado o no está en el PATH")
        print("\n📋 Para instalar MongoDB en macOS:")
        print("   brew tap mongodb/brew")
        print("   brew install mongodb-community")
        print("\n📋 Para iniciar MongoDB:")
        print("   brew services start mongodb/brew/mongodb-community")
        return False
    
    # Verificar si MongoDB está ejecutándose
    try:
        result = subprocess.run(['mongo', '--eval', 'db.runCommand("ping").ok'], 
                              capture_output=True, text=True, timeout=5)
        if '1' in result.stdout:
            print("✅ MongoDB está ejecutándose")
            return True
        else:
            print("❌ MongoDB no está ejecutándose")
            print("\n📋 Para iniciar MongoDB:")
            print("   brew services start mongodb/brew/mongodb-community")
            print("   # O manualmente: mongod --config /usr/local/etc/mongod.conf")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        # Intentar con mongosh (nueva shell de MongoDB)
        try:
            result = subprocess.run(['mongosh', '--eval', 'db.runCommand("ping").ok'], 
                                  capture_output=True, text=True, timeout=5)
            if '1' in result.stdout:
                print("✅ MongoDB está ejecutándose")
                return True
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        
        print("❌ No se puede conectar a MongoDB")
        print("\n📋 Para iniciar MongoDB:")
        print("   brew services start mongodb/brew/mongodb-community")
        return False

def check_dependencies():
    """Verificar si las dependencias de Python están instaladas"""
    requirements_file = Path(__file__).parent / 'requirements.txt'
    
    if not requirements_file.exists():
        print("❌ Archivo requirements.txt no encontrado")
        return False
    
    try:
        # Verificar si pip está disponible
        subprocess.run([sys.executable, '-m', 'pip', '--version'], 
                      check=True, capture_output=True)
        print("✅ pip está disponible")
        
        # Instalar dependencias
        print("📦 Instalando dependencias...")
        result = subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Dependencias instaladas correctamente")
            return True
        else:
            print("❌ Error instalando dependencias:")
            print(result.stderr)
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error con pip: {e}")
        return False

def create_env_file():
    """Crear archivo .env si no existe"""
    env_file = Path(__file__).parent / '.env'
    env_example = Path(__file__).parent / '.env.example'
    
    if not env_file.exists() and env_example.exists():
        print("📝 Creando archivo .env desde .env.example...")
        with open(env_example, 'r') as src, open(env_file, 'w') as dst:
            dst.write(src.read())
        print("✅ Archivo .env creado")
        print("⚠️  Recuerda configurar las variables de entorno en .env")
    elif env_file.exists():
        print("✅ Archivo .env existe")
    else:
        print("❌ No se encontró .env.example para crear .env")

def start_server():
    """Iniciar el servidor FastAPI"""
    print("\n🚀 Iniciando servidor RehabiLife...")
    print("📍 El servidor estará disponible en: http://localhost:8000")
    print("📖 Documentación API: http://localhost:8000/docs")
    print("\n⏹️  Presiona Ctrl+C para detener el servidor\n")
    
    try:
        # Cambiar al directorio del backend
        os.chdir(Path(__file__).parent)
        
        # Iniciar uvicorn
        subprocess.run([sys.executable, '-m', 'uvicorn', 'main:app', 
                       '--host', '0.0.0.0', '--port', '8000', '--reload'])
    except KeyboardInterrupt:
        print("\n\n👋 Servidor detenido")
    except Exception as e:
        print(f"❌ Error iniciando el servidor: {e}")

def main():
    """Función principal"""
    print("🏥 RehabiLife Backend - Script de Inicio")
    print("=" * 40)
    
    # Verificaciones previas
    checks = [
        ("Versión de Python", check_python_version),
        ("MongoDB", check_mongodb),
        ("Dependencias de Python", check_dependencies)
    ]
    
    all_checks_passed = True
    
    for check_name, check_func in checks:
        print(f"\n🔍 Verificando {check_name}...")
        if not check_func():
            all_checks_passed = False
    
    if not all_checks_passed:
        print("\n❌ Algunas verificaciones fallaron. Por favor, resuelve los problemas antes de continuar.")
        print("\n📋 Pasos recomendados:")
        print("1. Instala MongoDB si no está instalado")
        print("2. Inicia MongoDB: brew services start mongodb/brew/mongodb-community")
        print("3. Instala las dependencias: pip install -r requirements.txt")
        print("4. Ejecuta este script nuevamente")
        return 1
    
    # Crear archivo .env
    create_env_file()
    
    print("\n✅ Todas las verificaciones pasaron")
    
    # Preguntar si iniciar el servidor
    try:
        response = input("\n¿Deseas iniciar el servidor ahora? (s/N): ").strip().lower()
        if response in ['s', 'si', 'sí', 'y', 'yes']:
            start_server()
        else:
            print("\n📋 Para iniciar el servidor manualmente:")
            print("   python start.py")
            print("   # O directamente:")
            print("   uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
    except KeyboardInterrupt:
        print("\n\n👋 Cancelado por el usuario")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())