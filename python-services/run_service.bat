@echo off
setlocal

:: Cambiar al directorio donde está este archivo .bat
cd /d "%~dp0"

:: Verificar si existe el entorno virtual
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Entorno virtual no encontrado. Ejecuta primero: python -m venv venv
    echo    Luego instala dependencias: venv\Scripts\activate ^&^& pip install -r requirements.txt
    pause
    exit /b 1
)

:: Activar entorno virtual
call venv\Scripts\activate

:: Configurar PYTHONPATH al directorio actual
set PYTHONPATH=%CD%

:: Verificar que existe el archivo .env
if not exist ".env" (
    echo ⚠️  Archivo .env no encontrado
    echo    Copia config.env.example a .env y configura tus variables
    if exist "config.env.example" (
        copy config.env.example .env
        echo ✅ Archivo .env creado desde config.env.example
        echo    Edita .env con tu configuración antes de continuar
    )
    pause
    exit /b 1
)

:: Iniciar el servicio
echo 🚀 Iniciando servicio de huellas dactilares...
echo    URL: http://127.0.0.1:8001
echo    Presiona Ctrl+C para detener
echo.
uvicorn server:app --host 127.0.0.1 --port 8001 --workers 1
