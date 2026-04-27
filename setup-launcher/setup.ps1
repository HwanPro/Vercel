#Requires -Version 5.1
<#
.SYNOPSIS
  WolfGym - Instalador / Lanzador automático

.DESCRIPTION
  Al primer arranque: busca drivers ZKTeco, instala Node.js si falta, configura la app.
  En arranques posteriores: levanta los servicios directamente.

  Para compilar a .exe:
    Install-Module ps2exe -Scope CurrentUser
    Invoke-ps2exe setup.ps1 WolfGym-Launcher.exe -noConsole -title "WolfGym Launcher"
#>

[CmdletBinding()]
param(
    [switch]$FirstRun,
    [switch]$StopAll,
    [switch]$Status
)

$ErrorActionPreference = "Stop"
$HOST_TITLE = "WolfGym Launcher"
$APP_DIR    = $PSScriptRoot
$LOG_FILE   = Join-Path $APP_DIR "launcher.log"

# ── Helpers ────────────────────────────────────────────────────────────────────

function Log {
    param([string]$Msg, [string]$Level = "INFO")
    $ts  = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "[$ts] [$Level] $Msg"
    Write-Host $line
    Add-Content -Path $LOG_FILE -Value $line -Encoding UTF8
}

function Show-Banner {
    Clear-Host
    Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║         WOLF GYM - SISTEMA           ║" -ForegroundColor Cyan
    Write-Host "║    Gestión + Lector de Huellas       ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# ── Detección de DLLs de ZKTeco ──────────────────────────────────────────────

function Find-ZKDll {
    param([string]$DllName)

    $searchPaths = @(
        "C:\Program Files\ZKFingerSDK_Windows_Standard",
        "C:\Program Files (x86)\ZKFingerSDK_Windows_Standard",
        "D:\Downloads\ZKFinger SDK V10.0-Windows-Lite",
        "C:\ZKFinger10",
        "C:\ZKTeco",
        "C:\Program Files\ZKTeco",
        "C:\Program Files (x86)\ZKTeco",
        "C:\Program Files\ZKFinger SDK",
        "C:\Program Files (x86)\ZKFinger SDK",
        $env:ProgramFiles,
        ${env:ProgramFiles(x86)}
    )

    # 1. Buscar en System32 / SysWOW64
    $sys32 = Join-Path $env:SystemRoot "System32\$DllName"
    if (Test-Path $sys32) { return $sys32 }
    $syswow = Join-Path $env:SystemRoot "SysWOW64\$DllName"
    if (Test-Path $syswow) { return $syswow }

    # 2. Buscar en rutas conocidas del SDK (x64 preferido)
    foreach ($root in $searchPaths) {
        if (-not (Test-Path $root)) { continue }
        try {
            $found = Get-ChildItem -Path $root -Filter $DllName -Recurse -ErrorAction SilentlyContinue |
                     Sort-Object { if ($_.DirectoryName -match 'x64') { 0 } else { 1 } } |
                     Select-Object -First 1
            if ($found) { return $found.FullName }
        } catch { }
    }

    return $null
}

function Ensure-ZKDlls {
    param([string]$TargetDir)

    $dlls   = @("libzkfp.dll", "libzkfpcsharp.dll")
    $ok     = $true
    $report = @()

    foreach ($dll in $dlls) {
        $dest = Join-Path $TargetDir $dll
        if (Test-Path $dest) {
            $report += "  [OK]  $dll  (ya presente)"
            continue
        }

        Log "Buscando $dll en el sistema..."
        $src = Find-ZKDll $dll

        if ($src) {
            Copy-Item $src $dest -Force
            $report += "  [OK]  $dll  copiado desde $src"
            Log "  Copiado: $src → $dest"
        } else {
            $report += "  [!!]  $dll  NO ENCONTRADO"
            Log "  ADVERTENCIA: $dll no encontrado" "WARN"
            $ok = $false
        }
    }

    return [PSCustomObject]@{ Ok = $ok; Report = $report }
}

# ── Verificación de prerequisitos ─────────────────────────────────────────────

function Test-NodeJS {
    try {
        $v = & node --version 2>$null
        return $v -match "v\d+"
    } catch { return $false }
}

function Test-DotNet8 {
    try {
        $runtimes = & dotnet --list-runtimes 2>$null
        return ($runtimes | Where-Object { $_ -match "Microsoft.AspNetCore.App 8\." }).Count -gt 0
    } catch { return $false }
}

function Test-ServiceRunning {
    param([string]$Url, [int]$TimeoutSec = 3)
    try {
        $resp = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSec -ErrorAction Stop
        return $true
    } catch { return $false }
}

# ── Procesos ──────────────────────────────────────────────────────────────────

$script:NextPid      = $null
$script:BiometricPid = $null

function Start-NextApp {
    $nextDir = Join-Path $APP_DIR "webapp"
    if (-not (Test-Path (Join-Path $nextDir "package.json"))) {
        $nextDir = $APP_DIR  # fallback: misma carpeta
    }

    Log "Iniciando servidor Next.js en $nextDir..."
    $p = Start-Process "node" `
         -ArgumentList @((Join-Path $nextDir "node_modules\.bin\next"), "start", "-p", "3000") `
         -WorkingDirectory $nextDir `
         -PassThru -WindowStyle Hidden
    $script:NextPid = $p.Id
    Log "Next.js PID=$($p.Id)"
    return $p
}

function Start-BiometricService {
    $bioDir = Join-Path $APP_DIR "biometric"
    $bioExe = Join-Path $bioDir "WolfGym.BiometricService.exe"

    if (-not (Test-Path $bioExe)) {
        Log "Servicio biométrico no encontrado en $bioExe" "ERROR"
        return $null
    }

    Log "Iniciando servicio biométrico..."
    $p = Start-Process $bioExe -WorkingDirectory $bioDir -PassThru -WindowStyle Hidden
    $script:BiometricPid = $p.Id
    Log "Biometric PID=$($p.Id)"
    return $p
}

function Stop-All {
    Log "Deteniendo servicios..."
    if ($script:NextPid) {
        try { Stop-Process -Id $script:NextPid -Force -ErrorAction SilentlyContinue } catch {}
    }
    if ($script:BiometricPid) {
        try { Stop-Process -Id $script:BiometricPid -Force -ErrorAction SilentlyContinue } catch {}
    }
    # Por nombre si quedaron huérfanos
    Get-Process "WolfGym.BiometricService" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.MainWindowTitle -eq "" -and $_.CommandLine -match "next"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
}

# ── Flujo principal ───────────────────────────────────────────────────────────

Show-Banner

if ($StopAll) {
    Stop-All
    Log "Servicios detenidos."
    exit 0
}

if ($Status) {
    $nextOk = Test-ServiceRunning "http://localhost:3000/api/health" 5
    $bioOk  = Test-ServiceRunning "http://127.0.0.1:8001/health" 3
    Write-Host "Next.js (3000):    $(if ($nextOk) { 'CORRIENDO' } else { 'DETENIDO' })"
    Write-Host "Biométrico (8001): $(if ($bioOk)  { 'CORRIENDO' } else { 'DETENIDO' })"
    exit 0
}

# ── Verificar prerequisitos ───────────────────────────────────────────────────

Log "Verificando prerequisitos..."

$missingReqs = @()
if (-not (Test-NodeJS))    { $missingReqs += "Node.js (descarga: https://nodejs.org)" }
if (-not (Test-DotNet8))   { $missingReqs += ".NET 8 Runtime ASP.NET Core (descarga: https://dotnet.microsoft.com/download/dotnet/8.0)" }

if ($missingReqs.Count -gt 0) {
    Write-Host ""
    Write-Host "╔══ PREREQUISITOS FALTANTES ══╗" -ForegroundColor Red
    foreach ($req in $missingReqs) {
        Write-Host "  - $req" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Por favor instale los prerequisitos y vuelva a ejecutar." -ForegroundColor Red
    Read-Host "Presione ENTER para salir"
    exit 1
}

# ── Buscar y copiar DLLs de ZKTeco ────────────────────────────────────────────

Log "Buscando DLLs del sensor ZKTeco..."
$bioDir    = Join-Path $APP_DIR "biometric"
$dllResult = Ensure-ZKDlls -TargetDir $bioDir

Write-Host ""
Write-Host "Estado DLLs ZKTeco:" -ForegroundColor Cyan
foreach ($line in $dllResult.Report) {
    $color = if ($line -match '\[OK\]') { "Green" } else { "Yellow" }
    Write-Host $line -ForegroundColor $color
}
Write-Host ""

if (-not $dllResult.Ok) {
    Write-Host "ADVERTENCIA: Algunas DLLs de ZKTeco no se encontraron." -ForegroundColor Yellow
    Write-Host "El sensor de huellas puede no funcionar." -ForegroundColor Yellow
    Write-Host "Instale el driver ZKTeco ZK9500 desde el CD del dispositivo o zktecousa.com" -ForegroundColor Yellow
    Write-Host ""
    $resp = Read-Host "¿Continuar de todas formas? (s/n)"
    if ($resp.ToLower() -ne "s") { exit 1 }
}

# ── Iniciar servicios ─────────────────────────────────────────────────────────

Log "Iniciando servicios..."

$bioProcess  = Start-BiometricService
$nextProcess = Start-NextApp

# Esperar a que levanten
Write-Host ""
Write-Host "Esperando que los servicios inicien..." -ForegroundColor Cyan
$maxWait = 30  # segundos
$elapsed = 0
$bioOk   = $false
$nextOk  = $false

while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    if (-not $bioOk)  { $bioOk  = Test-ServiceRunning "http://127.0.0.1:8001/health" 2 }
    if (-not $nextOk) { $nextOk = Test-ServiceRunning "http://localhost:3000" 2 }

    Write-Host "  Biométrico: $(if ($bioOk) {'OK'} else {'...'})   Web: $(if ($nextOk) {'OK'} else {'...'})" `
               -ForegroundColor $(if ($bioOk -and $nextOk) {"Green"} else {"Yellow"})

    if ($bioOk -and $nextOk) { break }
}

Write-Host ""
if ($bioOk -and $nextOk) {
    Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   ✓ SISTEMA ACTIVO Y LISTO           ║" -ForegroundColor Green
    Write-Host "║                                      ║" -ForegroundColor Green
    Write-Host "║   Web:   http://localhost:3000       ║" -ForegroundColor Green
    Write-Host "║   API:   http://127.0.0.1:8001       ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Green
    Log "Sistema iniciado correctamente."

    # Abrir navegador automáticamente
    Start-Process "http://localhost:3000"
} else {
    Write-Host "ADVERTENCIA: Algunos servicios no respondieron a tiempo." -ForegroundColor Yellow
    Write-Host "  Biométrico (8001): $(if ($bioOk) { 'OK' } else { 'Sin respuesta' })"
    Write-Host "  Web (3000):        $(if ($nextOk) { 'OK' } else { 'Sin respuesta' })"
    Write-Host ""
    Write-Host "Revise los logs en: $LOG_FILE" -ForegroundColor Cyan
    Log "Algunos servicios no respondieron en $maxWait segundos." "WARN"
}

Write-Host ""
Write-Host "Presione Ctrl+C para detener o cierre esta ventana." -ForegroundColor Gray

# Mantener vivos los procesos y monitorear
try {
    while ($true) {
        Start-Sleep -Seconds 15
        $bioAlive  = $bioProcess  -and -not $bioProcess.HasExited
        $nextAlive = $nextProcess -and -not $nextProcess.HasExited

        if (-not $bioAlive) {
            Log "Servicio biométrico caído. Reiniciando..." "WARN"
            $bioProcess = Start-BiometricService
        }
        if (-not $nextAlive) {
            Log "Servidor web caído. Reiniciando..." "WARN"
            $nextProcess = Start-NextApp
        }
    }
} finally {
    Stop-All
    Log "Launcher detenido."
}
