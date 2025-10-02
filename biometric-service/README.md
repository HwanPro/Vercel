# WolfGym Biometric Service

Servicio Windows en .NET 8 x64 que envuelve el SDK ZKFinger 10 para el lector ZK9500, exponiendo una API REST local para integración con aplicaciones web.

## Requisitos

- Windows 10/11 x64
- .NET 8 Runtime x64 (https://dotnet.microsoft.com/download/dotnet/8.0)
- Lector de huellas ZK9500 (USB)
- PostgreSQL con la base de datos de WolfGym

## Instalación

### Opción 1: Ejecutar desde build

1. Descargar el release desde `biometric-service/bin/Release/net8.0/win-x64/publish/`
2. Copiar `libzkfp.dll` (nativa x64) a la misma carpeta del ejecutable
3. Editar `appsettings.json` con la cadena de conexión correcta a PostgreSQL
4. Ejecutar `WolfGym.BiometricService.exe`

### Opción 2: Compilar desde código

```powershell
cd biometric-service
dotnet restore
dotnet publish -c Release -r win-x64 --self-contained false
```

## Configuración

Editar `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=wolfgym;Username=postgres;Password=tu_password"
  },
  "BiometricService": {
    "Threshold": 55,
    "CaptureTimeout": 5000,
    "MergeSamples": true
  }
}
```

## Migración de Base de Datos

Antes de usar el servicio, aplicar la migración de Prisma para actualizar el schema:

```bash
cd ../  # Ir a la raíz del proyecto
npx prisma migrate dev --name add_fingerprint_multi_finger
```

## API Endpoints

La API escucha en `http://127.0.0.1:8001`

### Device Management

- **POST /device/open** - Inicializa y abre el dispositivo
  - Response: `{ ok, deviceCount, serial, width, height, fpVersion }`

- **POST /device/close** - Cierra el dispositivo
  - Response: `{ ok, message? }`

- **GET /device/status** - Estado actual del dispositivo
  - Response: `{ ok, opened, serial, hasDB, sdkVersion }`

### Capture & Enroll

- **POST /capture** - Captura una huella
  - Response: `{ ok, template_b64, image_b64, length, quality }`

- **POST /enroll** - Registra una huella (requiere 3 muestras)
  - Body: `{ userId, fingerIndex, samplesB64: string[] }`
  - Response: `{ ok, message, templateLen }`

### Verification & Identification

- **POST /verify** - Verificación 1:1
  - Body: `{ userId, fingerIndex, templateB64 }`
  - Response: `{ ok, match, score, threshold }`

- **POST /identify** - Identificación 1:N
  - Body: `{ templateB64 }`
  - Response: `{ ok, match, userId?, fingerIndex?, score, threshold }`

### Utilities

- **GET /image/snapshot** - Última imagen capturada (JPEG)
  - Response: image/jpeg

- **GET /config** - Configuración actual
- **POST /config** - Actualizar configuración
  - Body: `{ threshold?, timeout?, mergeSamples? }`

- **GET /health** - Health check
  - Response: `{ ok: true }`

## Integración con Next.js

### 1. Registro de Huella (Admin/Perfil)

```typescript
async function enrollFingerprint(userId: string, fingerIndex: number) {
  const samples: string[] = [];
  
  // Capturar 3 muestras
  for (let i = 0; i < 3; i++) {
    const response = await fetch('http://127.0.0.1:8001/capture', {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.ok && data.template_b64) {
      samples.push(data.template_b64);
      console.log(`Muestra ${i + 1}/3 capturada`);
    } else {
      throw new Error('Error al capturar huella');
    }
  }
  
  // Registrar
  const enrollResponse = await fetch('http://127.0.0.1:8001/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      fingerIndex,
      samplesB64: samples
    })
  });
  
  const enrollData = await enrollResponse.json();
  return enrollData;
}
```

### 2. Identificación (Recepción/Check-in)

```typescript
async function identifyUser() {
  // Capturar huella
  const captureResponse = await fetch('http://127.0.0.1:8001/capture', {
    method: 'POST'
  });
  const captureData = await captureResponse.json();
  
  if (!captureData.ok) {
    throw new Error('Error al capturar huella');
  }
  
  // Identificar
  const identifyResponse = await fetch('http://127.0.0.1:8001/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateB64: captureData.template_b64
    })
  });
  
  const identifyData = await identifyResponse.json();
  
  if (identifyData.match && identifyData.userId) {
    // Llamar a tu API de negocio para obtener datos del usuario
    const userResponse = await fetch(`/api/users/${identifyData.userId}`);
    const userData = await userResponse.json();
    
    // Mostrar información
    console.log('Usuario identificado:', userData.firstName, userData.lastName);
    console.log('Plan:', userData.profile?.profile_plan);
    console.log('Deuda:', userData.profile?.debt);
    
    return userData;
  } else {
    console.log('Usuario no identificado');
    return null;
  }
}
```

## Logs

Los logs se almacenan en:
```
%PROGRAMDATA%\WolfGym\biometric\logs\
```

Ej: `C:\ProgramData\WolfGym\biometric\logs\service-20250930.log`

## Troubleshooting

### Error: "No device connected"
- Verificar que el lector ZK9500 esté conectado por USB
- Instalar los drivers del fabricante si es necesario
- Reiniciar el servicio

### Error: "Failed to initialize SDK"
- Verificar que `libzkfpcsharp.dll` y `libzkfp.dll` estén en la carpeta del ejecutable
- Verificar que las DLLs sean de la versión x64
- Ejecutar como administrador si es necesario

### Error: "Connection string not found"
- Verificar que `appsettings.json` exista en la carpeta del ejecutable
- Verificar que la cadena de conexión sea correcta

### La verificación/identificación falla constantemente
- Ajustar el threshold en `/config` (valores típicos: 50-60)
- Re-enrolar huellas de baja calidad
- Limpiar el sensor del lector

## Estructura del Proyecto

```
biometric-service/
├── Controllers/          # API Controllers
├── Data/                 # Repositories (Npgsql)
├── Models/               # DTOs y modelos
├── SDK/                  # Wrapper del SDK ZKFinger
├── Services/             # ZKFingerService
├── Utils/                # Helpers (conversión de imágenes)
├── Program.cs            # Entry point
├── appsettings.json      # Configuración
└── WolfGym.BiometricService.csproj
```

## Licencia

Uso interno de WolfGym.
