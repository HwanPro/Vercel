# Script de recompilación rápida del servicio biométrico
# Uso: .\rebuild.ps1

Write-Host "🔨 Recompilando servicio biométrico..." -ForegroundColor Cyan

# Navegar al directorio del proyecto
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

# Compilar y publicar
Write-Host "📦 Compilando..." -ForegroundColor Yellow
dotnet publish -c Release -r win-x64 --self-contained false -o "bin\Release\net8.0\win-x64\publish"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compilación exitosa!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para ejecutar el servicio:" -ForegroundColor Cyan
    Write-Host "  cd bin\Release\net8.0\win-x64\publish" -ForegroundColor White
    Write-Host "  .\WolfGym.BiometricService.exe" -ForegroundColor White
} else {
    Write-Host "❌ Error en la compilación" -ForegroundColor Red
    exit 1
}





