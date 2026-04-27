#Requires -Version 5.1
<#
.SYNOPSIS
  Compila y empaqueta WolfGym en una carpeta lista para distribuir.
  Ejecutar desde la raíz del proyecto: .\setup-launcher\build-package.ps1

.OUTPUTS
  dist\WolfGym-vX.X\
    ├── biometric\         ← Servicio C# compilado (self-contained)
    ├── webapp\            ← Next.js build + node_modules
    ├── WolfGym.bat        ← Lanzador (doble clic para iniciar)
    └── README-INICIO.txt  ← Instrucciones rápidas
#>

$ErrorActionPreference = "Stop"
$ROOT   = Split-Path $PSScriptRoot -Parent
$DIST   = Join-Path $ROOT "dist\WolfGym"
$BIO_SRC = Join-Path $ROOT "biometric-service"
$BIO_DEST = Join-Path $DIST "biometric"
$WEB_DEST = Join-Path $DIST "webapp"
$SETUP_SRC = Join-Path $ROOT "setup-launcher"

Write-Host "=== WolfGym Package Builder ===" -ForegroundColor Green
Write-Host "Destino: $DIST" -ForegroundColor Cyan
Write-Host ""

# ── Limpiar ────────────────────────────────────────────────────────────────────
if (Test-Path $DIST) {
    Write-Host "Limpiando build anterior..." -ForegroundColor Yellow
    Remove-Item $DIST -Recurse -Force
}
New-Item $DIST     -ItemType Directory | Out-Null
New-Item $BIO_DEST -ItemType Directory | Out-Null
New-Item $WEB_DEST -ItemType Directory | Out-Null

# ── 1. Compilar servicio biométrico C# (self-contained) ──────────────────────
Write-Host "Compilando servicio biométrico..." -ForegroundColor Cyan

dotnet publish $BIO_SRC `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=false `
    -p:PublishReadyToRun=true `
    -o $BIO_DEST

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR al compilar el servicio biométrico." -ForegroundColor Red
    exit 1
}

Write-Host "  Servicio biométrico compilado OK" -ForegroundColor Green

# ── 2. Copiar config de producción ────────────────────────────────────────────
$prodConfig = Join-Path $BIO_SRC "appsettings.Production.json"
if (Test-Path $prodConfig) {
    Copy-Item $prodConfig (Join-Path $BIO_DEST "appsettings.json") -Force
    Write-Host "  Config de producción copiada" -ForegroundColor Green
}

# ── 3. Build Next.js ──────────────────────────────────────────────────────────
Write-Host "Compilando app web (Next.js)..." -ForegroundColor Cyan
Push-Location $ROOT
try {
    # Generar Prisma client
    & npx prisma generate
    if ($LASTEXITCODE -ne 0) { throw "prisma generate falló" }

    # Build de producción
    $env:NODE_ENV = "production"
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm build falló" }
} finally {
    Pop-Location
}

# Copiar archivos necesarios para next start
$itemsToCopy = @(".next", "public", "package.json", "next.config.cjs", "prisma")
foreach ($item in $itemsToCopy) {
    $src = Join-Path $ROOT $item
    $dst = Join-Path $WEB_DEST $item
    if (Test-Path $src) {
        Copy-Item $src $dst -Recurse -Force
    }
}

# Copiar node_modules (solo producción)
Write-Host "  Instalando dependencias de producción..." -ForegroundColor Yellow
Push-Location $WEB_DEST
try {
    & npm install --omit=dev --ignore-scripts 2>&1 | Out-Null
} finally {
    Pop-Location
}

Write-Host "  App web compilada OK" -ForegroundColor Green

# ── 4. Crear lanzador .bat ─────────────────────────────────────────────────────
Write-Host "Creando lanzador..." -ForegroundColor Cyan

$batContent = @'
@echo off
title WolfGym - Sistema de Gimnasio
cd /d "%~dp0"

echo.
echo  ==========================================
echo   WOLF GYM - Iniciando sistema...
echo  ==========================================
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no encontrado.
    echo Por favor instale Node.js desde https://nodejs.org
    pause
    exit /b 1
)

REM Iniciar servicio biometrico en background
echo [1/2] Iniciando lector de huellas...
start "" /min "%~dp0biometric\WolfGym.BiometricService.exe"

REM Esperar 3 segundos
timeout /t 3 /nobreak >nul

REM Iniciar app web
echo [2/2] Iniciando aplicacion web...
cd /d "%~dp0webapp"
start "" /min node node_modules\.bin\next start -p 3000

REM Esperar que levante
timeout /t 5 /nobreak >nul

REM Abrir navegador
echo Abriendo navegador...
start "" http://localhost:3000

echo.
echo  Sistema iniciado. Cierre esta ventana para detener todo.
echo.
pause

REM Al cerrar, detener procesos
taskkill /im "WolfGym.BiometricService.exe" /f >nul 2>&1
taskkill /im "node.exe" /f >nul 2>&1
'@

Set-Content (Join-Path $DIST "WolfGym.bat") $batContent -Encoding UTF8

# ── 5. Buscar DLLs de ZKTeco y copiarlas al paquete ──────────────────────────
Write-Host "Buscando DLLs de ZKTeco para incluir en el paquete..." -ForegroundColor Cyan

$zkDlls = @("libzkfp.dll", "libzkfpcsharp.dll")
$zkSearchPaths = @(
    "C:\Program Files\ZKFingerSDK_Windows_Standard",
    "C:\Program Files (x86)\ZKFingerSDK_Windows_Standard",
    "D:\Downloads\ZKFinger SDK V10.0-Windows-Lite",
    "C:\ZKFinger10",
    "C:\ZKTeco",
    "$env:SystemRoot\System32",
    "$env:SystemRoot\SysWOW64"
)

foreach ($dll in $zkDlls) {
    $dest = Join-Path $BIO_DEST $dll
    if (Test-Path $dest) { continue }

    foreach ($searchRoot in $zkSearchPaths) {
        if (-not (Test-Path $searchRoot)) { continue }
        $found = Get-ChildItem $searchRoot -Filter $dll -Recurse -ErrorAction SilentlyContinue |
                 Sort-Object { if ($_.DirectoryName -match 'x64') { 0 } else { 1 } } |
                 Select-Object -First 1
        if ($found) {
            Copy-Item $found.FullName $dest -Force
            Write-Host "  $dll incluido desde $($found.FullName)" -ForegroundColor Green
            break
        }
    }

    if (-not (Test-Path $dest)) {
        Write-Host "  ADVERTENCIA: $dll no encontrado (deberá copiarse manualmente)" -ForegroundColor Yellow
    }
}

# ── 6. README de inicio rápido ────────────────────────────────────────────────
$readme = @"
╔══════════════════════════════════════════════════════════╗
║              WOLF GYM - INICIO RÁPIDO                    ║
╚══════════════════════════════════════════════════════════╝

REQUISITOS PREVIOS (instalar una sola vez):
  1. Node.js 20+        → https://nodejs.org
  2. Driver ZKTeco ZK9500 → Incluido en el CD del dispositivo
                            o en https://www.zktecousa.com

CÓMO INICIAR:
  1. Conecte el lector de huellas (USB)
  2. Doble clic en  WolfGym.bat
  3. El navegador se abre automáticamente en http://localhost:3000

ACCESO DESDE OTRA PC EN LA RED:
  Abrir en el navegador: http://IP_DE_ESTA_PC:3000
  (La IP aparece al ejecutar: ipconfig en CMD)

PRIMERA VEZ / HUELLAS:
  - Registrar huellas: Perfil del cliente → Registrar huella
  - Marcar entrada: En el kiosco, colocar el dedo en el lector

CONEXIÓN A BASE DE DATOS:
  - Con internet: datos guardados en la nube automáticamente
  - Sin internet: el sistema puede funcionar localmente
    (los datos se sincronizan al recuperar la conexión)

SOPORTE:
  Revise los logs en la carpeta  biometric\logs\
"@

Set-Content (Join-Path $DIST "README-INICIO.txt") $readme -Encoding UTF8

# ── Resumen ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   BUILD COMPLETADO EXITOSAMENTE      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Paquete listo en: $DIST" -ForegroundColor Cyan
Write-Host ""
Write-Host "Contenido:" -ForegroundColor Yellow
Get-ChildItem $DIST | ForEach-Object {
    $size = if ($_.PSIsContainer) {
        "$((Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum / 1MB | [math]::Round(1)) MB"
    } else {
        "$([math]::Round($_.Length / 1KB, 1)) KB"
    }
    Write-Host "  $($_.Name)  ($size)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Para distribuir: comprima la carpeta '$DIST' en un ZIP" -ForegroundColor Cyan
