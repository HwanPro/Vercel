# ZKFinger runtime x64

Coloca aquí solo las DLL runtime permitidas por la licencia del SDK:

- `libzkfp.dll`
- `libzkfpcsharp.dll`

El build de `WolfGym.BiometricService` busca primero esta carpeta y luego las rutas locales del SDK.

Despues de instalar el SDK/driver oficial de ZKTeco, puedes poblar esta carpeta con:

```powershell
powershell -ExecutionPolicy Bypass -File ..\..\prepare-zkfinger-runtime.ps1
```

Si el SDK esta en una ruta rara:

```powershell
powershell -ExecutionPolicy Bypass -File ..\..\prepare-zkfinger-runtime.ps1 -SearchRoots "D:\MiSDK\ZKFinger"
```

Si quieres una busqueda completa en todos los discos:

```powershell
powershell -ExecutionPolicy Bypass -File ..\..\prepare-zkfinger-runtime.ps1 -ScanAllDrives
```

Importante: el lector ZK9500 puede requerir el driver USB de ZKTeco instalado en Windows con permisos de administrador. Git puede traer las DLL runtime, pero no puede garantizar que Windows tenga el driver del dispositivo.
