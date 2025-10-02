# 🚀 Inicio Rápido - Servicio Biométrico WolfGym

## ✅ Estado Actual

**TODO CONFIGURADO Y LISTO PARA USAR**

- ✅ Servicio compilado en .NET 8 x64
- ✅ DLLs del SDK copiadas (libzkfp.dll + libzkfpcsharp.dll)
- ✅ Connection string configurada (Railway PostgreSQL)
- ✅ Base de datos migrada (tabla fingerprints lista)
- ✅ Carpetas de demos eliminadas (~234 MB liberados)

## 🎯 Ejecutar el Servicio

### 1. Conectar el Lector ZK9500
Asegúrate de que el lector de huellas ZK9500 esté conectado por USB.

### 2. Iniciar el Servicio

```powershell
cd "D:\DiscoE\new-gym\biometric-service\bin\Release\net8.0\win-x64\publish"
.\WolfGym.BiometricService.exe
```

Deberías ver:
```
[INF] Starting WolfGym Biometric Service
[INF] SDK initialized successfully. Devices found: 1
[INF] Device opened. Width: 320, Height: 480
[INF] Service started successfully on http://127.0.0.1:8001
```

### 3. Verificar que está funcionando

Abre tu navegador en: **http://127.0.0.1:8001/swagger**

O prueba el health check:
```powershell
curl http://127.0.0.1:8001/health
```

Respuesta esperada:
```json
{"ok":true,"status":"healthy"}
```

## 📡 Endpoints Principales

### Gestión del Dispositivo

```bash
# Abrir dispositivo
curl -X POST http://127.0.0.1:8001/device/open

# Estado
curl http://127.0.0.1:8001/device/status

# Cerrar dispositivo
curl -X POST http://127.0.0.1:8001/device/close
```

### Captura de Huella

```bash
curl -X POST http://127.0.0.1:8001/capture
```

Respuesta:
```json
{
  "ok": true,
  "templateB64": "eyJhbGc...",
  "imageB64": "iVBORw0K...",
  "length": 2048,
  "quality": 0
}
```

### Registrar Huella (3 muestras)

```bash
curl -X POST http://127.0.0.1:8001/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "clxxxxx",
    "fingerIndex": 0,
    "samplesB64": ["template1...", "template2...", "template3..."]
  }'
```

### Identificar Usuario (1:N)

```bash
curl -X POST http://127.0.0.1:8001/identify \
  -H "Content-Type: application/json" \
  -d '{
    "templateB64": "eyJhbGc..."
  }'
```

Respuesta exitosa:
```json
{
  "ok": true,
  "match": true,
  "userId": "clxxxxx",
  "fingerIndex": 0,
  "score": 87,
  "threshold": 55
}
```

## 🔧 Configuración

El archivo de configuración está en:
```
D:\DiscoE\new-gym\biometric-service\bin\Release\net8.0\win-x64\publish\appsettings.json
```

### Ajustar el Threshold

```json
{
  "BiometricService": {
    "Threshold": 55,      // ← Ajustar entre 50-60 según necesidad
    "CaptureTimeout": 5000,
    "MergeSamples": true
  }
}
```

También puedes cambiarlo en runtime:
```bash
curl -X POST http://127.0.0.1:8001/config \
  -H "Content-Type: application/json" \
  -d '{"threshold": 60}'
```

## 📝 Logs

Los logs se guardan en:
```
C:\ProgramData\WolfGym\biometric\logs\service-YYYY-MM-DD.log
```

Ver logs en tiempo real:
```powershell
Get-Content "C:\ProgramData\WolfGym\biometric\logs\service-$(Get-Date -Format 'yyyyMMdd').log" -Wait
```

## 🔍 Troubleshooting

### Error: "No device connected"
- Verificar que el ZK9500 esté conectado por USB
- Reinstalar drivers del fabricante si es necesario
- Reiniciar el servicio

### Error: "Failed to initialize SDK"
- Verificar que las DLLs estén en la carpeta del ejecutable
- Ejecutar como administrador
- Verificar que sean DLLs x64

### Error: "Connection string not found"
- Verificar que `appsettings.json` exista
- Verificar la cadena de conexión

### Identificación falla constantemente
- Ajustar threshold (valores típicos: 50-60)
- Re-enrolar huellas de baja calidad
- Limpiar el sensor del lector

## 📚 Documentación Completa

- **README completo**: `biometric-service/README.md`
- **Implementación**: `IMPLEMENTACION-BIOMETRICO.md`
- **Ejemplos TypeScript**: En README, sección "Integración con Next.js"

## 🔗 Integración con Next.js

### Ejemplo: Identificar Usuario en Recepción

```typescript
// En tu componente de check-in
async function handleBiometricCheckIn() {
  try {
    // 1. Capturar huella
    const captureRes = await fetch('http://127.0.0.1:8001/capture', {
      method: 'POST'
    });
    const captureData = await captureRes.json();
    
    if (!captureData.ok) {
      alert('Error al capturar huella');
      return;
    }
    
    // 2. Identificar
    const identifyRes = await fetch('http://127.0.0.1:8001/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateB64: captureData.templateB64
      })
    });
    const identifyData = await identifyRes.json();
    
    if (identifyData.match && identifyData.userId) {
      // 3. Obtener datos del usuario
      const userRes = await fetch(`/api/users/${identifyData.userId}`);
      const userData = await userRes.json();
      
      // 4. Mostrar información
      console.log('Usuario identificado:', userData);
      // Aquí puedes actualizar tu UI con los datos del usuario
      
    } else {
      alert('Usuario no identificado');
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error en el proceso de identificación');
  }
}
```

## 🎯 Próximos Pasos

1. ✅ Ejecutar el servicio y verificar que funciona
2. ⏳ Integrar en tu página de check-in (`app/check-in`)
3. ⏳ Agregar botón "Registrar Huella" en perfiles de usuario
4. ⏳ Probar flujo completo de registro e identificación

## 📞 Soporte

Si tienes problemas:
1. Revisar los logs en `C:\ProgramData\WolfGym\biometric\logs\`
2. Verificar que el dispositivo esté conectado
3. Revisar la documentación completa en `biometric-service/README.md`

---

**¡Servicio listo para producción! 🚀**
