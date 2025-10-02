@echo off
echo ==============================
echo CONFIGURACION POST-REINICIO
echo ==============================

echo 1. Terminando procesos Python restantes...
taskkill /F /IM python.exe 2>nul

echo 2. Verificando puerto 8001...
netstat -ano | findstr ":8001"

echo 3. Iniciando SOLO el servicio C# biometrico...
cd /d "D:\DiscoE\new-gym\csharp-biometric-service\ZKBiometricAPI"
start "ZK C# Service" dotnet run --configuration Release --urls http://localhost:8002

echo 4. Esperando que el servicio inicie...
timeout 5

echo 5. Probando el dispositivo...
curl -s http://localhost:8002/health
curl -X POST http://localhost:8002/device/open

echo ==============================
echo CONFIGURACION COMPLETADA
echo Ahora puedes probar el registro desde el frontend!
echo ==============================
pause

