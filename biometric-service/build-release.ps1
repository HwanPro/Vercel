# Script de compilación para WolfGym Biometric Service
# Ejecutar como: .\build-release.ps1

param(
    [string]$Configuration = "Release",
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

Write-Host "=== WolfGym Biometric Service Build ===" -ForegroundColor Green
Write-Host ""

# Directorio del proyecto
$ProjectDir = $PSScriptRoot
$ProjectFile = Join-Path $ProjectDir "WolfGym.BiometricService.csproj"
$PublishDir = Join-Path $ProjectDir "bin\$Configuration\net8.0\win-x64\publish"
$VendorDir = Join-Path $ProjectDir "vendor\zkfinger\x64"

# Limpiar si se solicita
if ($Clean) {
    Write-Host "Limpiando build anterior..." -ForegroundColor Yellow
    if (Test-Path (Join-Path $ProjectDir "bin")) {
        Remove-Item (Join-Path $ProjectDir "bin") -Recurse -Force
    }
    if (Test-Path (Join-Path $ProjectDir "obj")) {
        Remove-Item (Join-Path $ProjectDir "obj") -Recurse -Force
    }
}

# Verificar que libzkfp.dll x64 nativa esté disponible
$NativeDllSource = @(
    (Join-Path $VendorDir "libzkfp.dll"),
    (Join-Path $ProjectDir "bin\$Configuration\net8.0\win-x64\publish\libzkfp.dll"),
    (Join-Path $ProjectDir "..\x64\Release\libzkfp.dll"),
    "D:\Downloads\ZKFinger SDK V10.0-Windows-Lite\C#\lib\x64\libzkfp.dll",
    "D:\Downloads\ZKFinger SDK V10.0-Windows-Lite\C\libs\x64\libzkfp.dll",
    "C:\ZKFinger10\x64\libzkfp.dll",
    "$env:SystemRoot\System32\libzkfp.dll"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$CSharpDllSource = @(
    (Join-Path $VendorDir "libzkfpcsharp.dll"),
    "D:\Downloads\ZKFinger SDK V10.0-Windows-Lite\C#\lib\x64\libzkfpcsharp.dll",
    (Join-Path $ProjectDir "bin\$Configuration\net8.0\win-x64\publish\libzkfpcsharp.dll"),
    "C:\ZKFinger10\x64\libzkfpcsharp.dll",
    "$env:SystemRoot\System32\libzkfpcsharp.dll"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $NativeDllSource) {
    Write-Host "ADVERTENCIA: libzkfp.dll x64 no encontrada." -ForegroundColor Yellow
    Write-Host "Debe estar en el driver instalado o copiarse manualmente al publish." -ForegroundColor Yellow
    Write-Host ""
}

# Restaurar dependencias
Write-Host "Restaurando dependencias..." -ForegroundColor Cyan
dotnet restore $ProjectFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al restaurar dependencias." -ForegroundColor Red
    exit 1
}

# Compilar
Write-Host "Compilando proyecto..." -ForegroundColor Cyan
dotnet build $ProjectFile -c $Configuration --no-restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al compilar." -ForegroundColor Red
    exit 1
}

# Publicar
Write-Host "Publicando aplicación..." -ForegroundColor Cyan
dotnet publish $ProjectFile -c $Configuration -r win-x64 --self-contained true --no-build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al publicar." -ForegroundColor Red
    exit 1
}

# Copiar libzkfp.dll nativa si existe
if ($NativeDllSource -and (Test-Path $NativeDllSource)) {
    Write-Host "Copiando libzkfp.dll nativa..." -ForegroundColor Cyan
    Copy-Item $NativeDllSource -Destination $PublishDir -Force
}

if ($CSharpDllSource -and (Test-Path $CSharpDllSource)) {
    Write-Host "Copiando libzkfpcsharp.dll x64..." -ForegroundColor Cyan
    Copy-Item $CSharpDllSource -Destination $PublishDir -Force
}

# Resumen
Write-Host ""
Write-Host "=== Build completado exitosamente ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ubicación: $PublishDir" -ForegroundColor White
Write-Host ""
Write-Host "Archivos generados:" -ForegroundColor Yellow
Get-ChildItem $PublishDir | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}
Write-Host ""

# Verificar DLLs críticas
$RequiredDlls = @("libzkfpcsharp.dll", "libzkfp.dll")
$MissingDlls = @()

foreach ($dll in $RequiredDlls) {
    $dllPath = Join-Path $PublishDir $dll
    if (-not (Test-Path $dllPath)) {
        $MissingDlls += $dll
    }
}

if ($MissingDlls.Count -gt 0) {
    Write-Host "ADVERTENCIA: Faltan las siguientes DLLs:" -ForegroundColor Yellow
    foreach ($dll in $MissingDlls) {
        Write-Host "  - $dll" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "El servicio NO funcionará sin estas DLLs." -ForegroundColor Red
    Write-Host "Debes copiarlas manualmente a: $PublishDir" -ForegroundColor Yellow
} else {
    Write-Host "Todas las DLLs requeridas están presentes." -ForegroundColor Green
}

Write-Host ""
Write-Host "Para ejecutar el servicio:" -ForegroundColor Cyan
Write-Host "  1. Editar appsettings.json con la cadena de conexión correcta" -ForegroundColor White
Write-Host "  2. Ejecutar: $PublishDir\WolfGym.BiometricService.exe" -ForegroundColor White
Write-Host ""
