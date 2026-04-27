#Requires -Version 5.1
<#
  Watchdog opcional para servicios Python legacy de WolfGym.
  Si python-services\server.py no existe, sale sin error para no competir con
  el servicio biométrico C# que corre en 127.0.0.1:8001.
#>

[CmdletBinding()]
param(
    [string]$ProjectRoot = "",
    [string]$Python = "python",
    [string]$HostName = "127.0.0.1",
    [int]$Port = 8010,
    [int]$RestartDelaySeconds = 5
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = Split-Path -Parent $PSScriptRoot
}
$ServiceDir = Join-Path $ProjectRoot "python-services"
$ServerFile = Join-Path $ServiceDir "server.py"
$LogDir = Join-Path $ServiceDir "logs"
$StdOut = Join-Path $LogDir "stdout.log"
$StdErr = Join-Path $LogDir "stderr.log"

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

if (-not (Test-Path $ServerFile)) {
    Add-Content -Path $StdErr -Value "[$(Get-Date -Format s)] Python watchdog desactivado: no existe $ServerFile"
    Write-Host "Python watchdog desactivado: no existe $ServerFile"
    exit 0
}

function Start-PythonService {
    Write-Host "Iniciando uvicorn en $HostName`:$Port..."
    Start-Process -FilePath $Python `
        -ArgumentList @("-m", "uvicorn", "server:app", "--host", $HostName, "--port", "$Port") `
        -WorkingDirectory $ServiceDir `
        -RedirectStandardOutput $StdOut `
        -RedirectStandardError $StdErr `
        -PassThru `
        -WindowStyle Hidden
}

$process = Start-PythonService

try {
    while ($true) {
        Start-Sleep -Seconds 10
        if ($process.HasExited) {
            Add-Content -Path $StdErr -Value "[$(Get-Date -Format s)] uvicorn cayó con código $($process.ExitCode). Reiniciando..."
            Start-Sleep -Seconds $RestartDelaySeconds
            $process = Start-PythonService
        }
    }
}
finally {
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
}
