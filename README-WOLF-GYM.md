# 🏋️ Wolf Gym - Sistema Biométrico Completo

Sistema completo de gestión de gimnasio con integración biométrica para Wolf Gym.

## 🏗️ Arquitectura del Sistema

### Frontend (Next.js)
- **Repositorio:** Separado (tu repositorio de Next.js)
- **URLs de producción:** `wolf-gym.com`, `www.wolf-gym.com`
- **Funcionalidades:**
  - Panel de administración de clientes
  - Sistema de check-in/check-out
  - Gestión de membresías
  - Registro y verificación de huellas dactilares

### Backend Biométrico (C#)
- **Repositorio:** [https://github.com/HwanPro/Python.git](https://github.com/HwanPro/Python.git)
- **URL de producción:** `biometric.wolf-gym.com`
- **Funcionalidades:**
  - Captura de huellas dactilares
  - Registro de huellas (enrollment)
  - Verificación 1:1
  - Identificación 1:N
  - Integración con ZKTeco ZK9500

## 🚀 Instalación y Configuración

### 1. Requisitos del Sistema

#### Hardware
- Lector de huellas ZKTeco ZK9500
- Windows 10/11 (64-bit)
- Mínimo 4GB RAM
- 2GB espacio libre en disco

#### Software
- **.NET 8.0 Runtime** - [Descargar](https://dotnet.microsoft.com/download/dotnet/8.0)
- **ZKFinger SDK** - Drivers del lector de huellas
- **PostgreSQL** - Base de datos (local o remota)
- **Navegador web** - Chrome, Edge, Firefox

### 2. Instalación del Servicio Biométrico

#### En la laptop del gym:

```powershell
# 1. Clonar el repositorio
git clone https://github.com/HwanPro/Python.git
cd Python

# 2. Instalar como servicio de Windows (como Administrador)
.\install-service.ps1

# 3. Configurar acceso de red (como Administrador)
.\configure-network.ps1
```

#### Scripts de instalación incluidos:
- `install-service.ps1` - Instala el servicio como servicio de Windows
- `configure-network.ps1` - Configura firewall y acceso de red
- `ejecutar-como-admin.bat` - Script para ejecutar como Administrador

### 3. Configuración de Red

#### Opción A: Cloudflare Tunnel (Recomendado)

```bash
# Instalar cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Crear tunnel
cloudflared tunnel create wolfgym-biometric

# Configurar DNS
cloudflared tunnel route dns wolfgym-biometric biometric.wolf-gym.com

# Ejecutar tunnel
cloudflared tunnel --url http://localhost:8002 run wolfgym-biometric
```

#### Opción B: ngrok

```bash
# Instalar ngrok
# https://ngrok.com/download

# Ejecutar tunnel
ngrok http 8002
```

### 4. Configuración de Next.js

#### Variables de entorno requeridas:

```env
# Servicio biométrico
NEXT_PUBLIC_BIOMETRIC_BASE=https://biometric.wolf-gym.com

# Base de datos
DATABASE_URL=postgresql://username:password@host:port/database

# Autenticación
NEXTAUTH_SECRET=tu-secret-key-aqui
NEXTAUTH_URL=https://wolf-gym.com
```

#### Configuración de DNS:
1. Crear subdominio `biometric.wolf-gym.com`
2. Configurar CNAME: `biometric` → `[tunnel-id].cfargotunnel.com`
3. Activar proxy en Cloudflare

## 🔧 Configuración por Entornos

### Desarrollo
- **Servicio C#:** `http://localhost:8002`
- **Next.js:** `http://localhost:3000`
- **CORS:** Solo localhost
- **Escucha:** Solo localhost

### Producción
- **Servicio C#:** `https://biometric.wolf-gym.com`
- **Next.js:** `https://wolf-gym.com`
- **CORS:** Dominios de Wolf Gym
- **Escucha:** Todas las interfaces

## 📡 API del Servicio Biométrico

### Endpoints Principales

#### Dispositivo
- `GET /device/status` - Estado del dispositivo
- `POST /device/open` - Abrir dispositivo
- `POST /device/close` - Cerrar dispositivo

#### Captura
- `POST /capture` - Capturar huella

#### Registro
- `POST /enroll` - Registrar huella (3 muestras)

#### Verificación
- `POST /verify` - Verificar huella 1:1
- `POST /identify` - Identificar huella 1:N

### Ejemplo de uso:

```typescript
// Capturar huella
const response = await fetch(`${BIOMETRIC_BASE}/capture`, {
  method: "POST"
});
const data = await response.json();

// Verificar huella
const verifyResponse = await fetch(`${BIOMETRIC_BASE}/verify`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    userId: "user123", 
    templateB64: data.template,
    fingerIndex: 0 
  })
});
```

## 🧪 Pruebas y Verificación

### Verificar Servicio Biométrico

```powershell
# Estado del servicio
Get-Service -Name WolfGymBiometricService

# Probar endpoint
Invoke-RestMethod -Uri "http://localhost:8002/device/status" -Method GET

# Ver logs
Get-EventLog -LogName Application -Source "WolfGymBiometricService" -Newest 10
```

### Verificar Integración

1. **Desarrollo:**
   - Abrir `http://localhost:3000`
   - Ir a página de check-in
   - Intentar capturar huella

2. **Producción:**
   - Abrir `https://wolf-gym.com`
   - Verificar que no haya errores de CORS
   - Probar captura de huella

## 🔄 Comandos de Administración

### Servicio Biométrico

```powershell
# Iniciar
Start-Service -Name WolfGymBiometricService

# Detener
Stop-Service -Name WolfGymBiometricService

# Reiniciar
Restart-Service -Name WolfGymBiometricService

# Estado
Get-Service -Name WolfGymBiometricService

# Desinstalar
sc.exe delete WolfGymBiometricService
```

### Cloudflare Tunnel

```bash
# Listar tunnels
cloudflared tunnel list

# Ejecutar tunnel
cloudflared tunnel --url http://localhost:8002 run wolfgym-biometric

# Ver logs
cloudflared tunnel --url http://localhost:8002 run wolfgym-biometric --loglevel debug
```

## 🚨 Solución de Problemas

### Error: "Device busy"
- **Causa:** Otra aplicación usando el lector
- **Solución:** Reiniciar el servicio

### Error: "Failed to open device"
- **Causa:** Lector no conectado o drivers no instalados
- **Solución:** Verificar conexión USB e instalar ZKFinger SDK

### Error: CORS
- **Causa:** Dominio no configurado en CORS
- **Solución:** Verificar configuración de CORS en `Program.cs`

### Error: "Connection refused"
- **Causa:** Servicio no ejecutándose o puerto bloqueado
- **Solución:** Verificar estado del servicio y firewall

## 📊 Logs y Monitoreo

### Logs del Servicio C#
- **Ubicación:** `C:\ProgramData\WolfGym\biometric\logs\`
- **Windows Event Log:** `Application` log, source `WolfGymBiometricService`

### Logs de Cloudflare Tunnel
- **Ubicación:** `~/.cloudflared/logs/`
- **Comando:** `cloudflared tunnel --url http://localhost:8002 run wolfgym-biometric --loglevel debug`

## 🔄 Actualizaciones

### Actualizar Servicio Biométrico

```powershell
# 1. Detener servicio
Stop-Service -Name WolfGymBiometricService

# 2. Actualizar código
git pull origin master

# 3. Recompilar
dotnet publish -c Release -r win-x64 --self-contained -o bin/Release/net8.0/win-x64/publish

# 4. Iniciar servicio
Start-Service -Name WolfGymBiometricService
```

### Actualizar Next.js
- Desplegar nueva versión con variables de entorno actualizadas

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs del servicio
2. Verificar configuración de red
3. Verificar variables de entorno
4. Contactar al desarrollador

## 📄 Licencia

Propietario - Wolf Gym

---

**Última actualización:** Enero 2025
