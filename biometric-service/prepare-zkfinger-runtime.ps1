#Requires -Version 5.1
<#
  Busca las DLL runtime del SDK ZKFinger en discos/carpetas locales y las copia
  a vendor\zkfinger\x64 para que el servicio biometrico las use en build/runtime.

  Uso recomendado despues de instalar el SDK/driver oficial:
    powershell -ExecutionPolicy Bypass -File .\prepare-zkfinger-runtime.ps1

  Busqueda completa en todos los discos, mas lenta:
    powershell -ExecutionPolicy Bypass -File .\prepare-zkfinger-runtime.ps1 -ScanAllDrives
#>

[CmdletBinding()]
param(
    [string[]]$SearchRoots = @(),
    [switch]$ScanAllDrives,
    [int]$MaxDepth = 7,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
$VendorDir = Join-Path $ProjectDir "vendor\zkfinger\x64"
New-Item -ItemType Directory -Path $VendorDir -Force | Out-Null

function Add-ExistingRoot {
    param(
        [System.Collections.Generic.List[string]]$Roots,
        [string]$Path
    )

    if ([string]::IsNullOrWhiteSpace($Path)) { return }
    try {
        $resolved = Resolve-Path -LiteralPath $Path -ErrorAction SilentlyContinue
        if ($resolved) {
            $full = $resolved.ProviderPath
            if (-not $Roots.Contains($full)) { $Roots.Add($full) }
        }
    } catch { }
}

function Get-DefaultSearchRoots {
    $roots = [System.Collections.Generic.List[string]]::new()

    foreach ($root in $SearchRoots) {
        Add-ExistingRoot $roots $root
    }

    $envRoots = @(
        $env:ZKFINGER_SDK_ROOT,
        $env:WOLFGYM_ZKFINGER_SDK,
        "D:\Downloads\ZKFinger SDK V10.0-Windows-Lite",
        "C:\ZKFinger10",
        "C:\ZKTeco",
        "C:\Program Files\ZKFingerSDK_Windows_Standard",
        "C:\Program Files (x86)\ZKFingerSDK_Windows_Standard",
        "C:\Program Files\ZKTeco",
        "C:\Program Files (x86)\ZKTeco",
        "$env:SystemRoot\System32",
        "$env:SystemRoot\SysWOW64"
    )

    foreach ($root in $envRoots) {
        Add-ExistingRoot $roots $root
    }

    $drives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Root -and (Test-Path $_.Root) }
    foreach ($drive in $drives) {
        $base = $drive.Root.TrimEnd('\')
        $common = @(
            "$base\Downloads",
            "$base\SDK",
            "$base\Drivers",
            "$base\ZKFinger10",
            "$base\ZKTeco",
            "$base\Program Files",
            "$base\Program Files (x86)"
        )

        foreach ($path in $common) {
            Add-ExistingRoot $roots $path
        }

        try {
            Get-ChildItem -LiteralPath "$base\" -Directory -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -match "ZK|ZKTeco|Finger|SDK" } |
                ForEach-Object { Add-ExistingRoot $roots $_.FullName }
        } catch { }

        try {
            Get-ChildItem -LiteralPath "$base\Users" -Directory -ErrorAction SilentlyContinue |
                ForEach-Object {
                    Add-ExistingRoot $roots (Join-Path $_.FullName "Downloads")
                    Add-ExistingRoot $roots (Join-Path $_.FullName "Desktop")
                }
        } catch { }
    }

    if ($ScanAllDrives) {
        foreach ($drive in $drives) {
            Add-ExistingRoot $roots $drive.Root
        }
    }

    return $roots
}

function Find-Dll {
    param([string]$Name)

    $candidateRoots = Get-DefaultSearchRoots
    Write-Host "Buscando $Name en $($candidateRoots.Count) ubicaciones..." -ForegroundColor Cyan

    foreach ($root in $candidateRoots) {
        try {
            $found = Get-ChildItem -LiteralPath $root -Filter $Name -Recurse -Depth $MaxDepth -File -ErrorAction SilentlyContinue |
                Sort-Object `
                    @{ Expression = { if ($_.DirectoryName -match "x64|win-x64|amd64") { 0 } else { 1 } } }, `
                    @{ Expression = { if ($_.FullName -match "x86|win-x86") { 1 } else { 0 } } }, `
                    FullName |
                Select-Object -First 1
            if ($found) { return $found.FullName }
        } catch {
            Write-Verbose "No se pudo revisar $root : $($_.Exception.Message)"
        }
    }

    return $null
}

$required = @("libzkfp.dll", "libzkfpcsharp.dll")
$missing = @()

foreach ($dll in $required) {
    $dest = Join-Path $VendorDir $dll
    if ((Test-Path $dest) -and -not $Force) {
        Write-Host "[OK] $dll ya existe en vendor" -ForegroundColor Green
        continue
    }

    $src = Find-Dll $dll
    if ($src) {
        Copy-Item $src $dest -Force
        Write-Host "[OK] $dll copiada desde $src" -ForegroundColor Green
    } else {
        $missing += $dll
        Write-Host "[FALTA] $dll no encontrada" -ForegroundColor Yellow
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "Faltan DLLs: $($missing -join ', ')" -ForegroundColor Yellow
    Write-Host "Instala el driver/SDK ZKTeco o copia las DLLs manualmente en $VendorDir" -ForegroundColor Yellow
    Write-Host "Si ya lo instalaste en una ruta no comun, ejecuta con -SearchRoots 'RUTA_DEL_SDK'." -ForegroundColor Yellow
    Write-Host "Para busqueda completa de discos, ejecuta con -ScanAllDrives." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Runtime ZKFinger listo en: $VendorDir" -ForegroundColor Green
