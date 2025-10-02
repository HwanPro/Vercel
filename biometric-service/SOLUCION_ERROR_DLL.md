# Solución al Error de DLL - Servicio Biométrico

## 🐛 Problema Identificado

El servicio biométrico estaba fallando con el error:

```
System.EntryPointNotFoundException: Unable to find an entry point named 'Init' in DLL 'libzkfpcsharp.dll'.
```

## 🔍 Causa Raíz

El archivo `SDK/ZKFingerSDK.cs` tenía declaraciones P/Invoke incorrectas:

### ❌ Antes (INCORRECTO)
```csharp
private const string DLL_NAME = "libzkfpcsharp.dll";

[DllImport(DLL_NAME, CallingConvention = CallingConvention.Cdecl)]
public static extern int Init();
```

**Problemas:**
1. ❌ La DLL nativa es `libzkfp.dll`, NO `libzkfpcsharp.dll`
2. ❌ Los nombres de las funciones deben tener el prefijo `ZKFPM_`
3. ❌ La función correcta es `ZKFPM_Init`, no `Init`

### ✅ Después (CORRECTO)
```csharp
private const string DLL_NAME = "libzkfp.dll";

[DllImport(DLL_NAME, EntryPoint = "ZKFPM_Init", CallingConvention = CallingConvention.Cdecl)]
public static extern int Init();
```

**Solución:**
1. ✅ Cambié la DLL de `libzkfpcsharp.dll` a `libzkfp.dll` (la DLL nativa real)
2. ✅ Agregué `EntryPoint` a todas las declaraciones con los nombres correctos (prefijo `ZKFPM_`)
3. ✅ Implementé las funciones auxiliares (`ByteArray2Int`, `BlobToBase64String`) con código .NET nativo en lugar de P/Invoke

## 📝 Cambios Realizados

### 1. Corrección de Todas las Declaraciones P/Invoke

Actualicé **todas** las funciones en `ZKFingerSDK.cs`:

- `ZKFPM_Init`
- `ZKFPM_Terminate`
- `ZKFPM_GetDeviceCount`
- `ZKFPM_OpenDevice`
- `ZKFPM_CloseDevice`
- `ZKFPM_GetParameters`
- `ZKFPM_DBInit`
- `ZKFPM_DBFree`
- `ZKFPM_DBMerge`
- `ZKFPM_DBAdd`
- `ZKFPM_DBDel`
- `ZKFPM_DBClear`
- `ZKFPM_DBCount`
- `ZKFPM_DBIdentify`
- `ZKFPM_DBMatch`
- `ZKFPM_AcquireFingerprint`

### 2. Implementación de Funciones Auxiliares

Las funciones auxiliares ahora usan .NET Framework en lugar de la DLL:

```csharp
// Implementación nativa en C# usando BitConverter y Convert
public static int ByteArray2Int(byte[] bytes, ref int value)
{
    if (bytes == null || bytes.Length < 4)
        return -1;
    
    value = BitConverter.ToInt32(bytes, 0);
    return 0;
}

public static string BlobToBase64String(byte[] blob, int len)
{
    if (blob == null || len <= 0) return string.Empty;
    return Convert.ToBase64String(blob, 0, len);
}
```

## 🚀 Cómo Probar la Solución

### Opción 1: Ejecutar desde la Consola (Recomendado para Testing)

```powershell
cd D:\DiscoE\new-gym\biometric-service\bin\Release\net8.0\win-x64\publish
.\WolfGym.BiometricService.exe
```

### Opción 2: Si Está Como Servicio de Windows

```powershell
# Detener el servicio
net stop WolfGymBiometric

# Copiar los archivos actualizados
copy D:\DiscoE\new-gym\biometric-service\bin\Release\net8.0\win-x64\publish\*.* C:\RutaDelServicio\

# Iniciar el servicio
net start WolfGymBiometric
```

## ✅ Verificación

Una vez iniciado el servicio, verifica que funcione correctamente:

### 1. Test de Ping
```bash
curl http://127.0.0.1:8002/health
```

Debería responder: `{"ok": true}`

### 2. Test de Apertura de Dispositivo
```bash
curl -X POST http://127.0.0.1:8002/device/open
```

**ANTES (con error):**
```json
{
  "ok": false,
  "deviceCount": 0,
  "message": "Unable to find an entry point named 'Init' in DLL 'libzkfpcsharp.dll'."
}
```

**AHORA (debería funcionar):**
```json
{
  "ok": true,
  "deviceCount": 1,
  "serial": "...",
  "width": 256,
  "height": 360,
  "fpVersion": "10.0"
}
```

## 📚 Referencia

La implementación correcta se basó en el servicio Python que ya estaba funcionando (`python-services/fingerprint_service/zk_device.py`), el cual usa correctamente las funciones con prefijo `ZKFPM_` de la DLL `libzkfp.dll`.

## ⚠️ Importante

- Asegúrate de que `libzkfp.dll` esté en la misma carpeta que `WolfGym.BiometricService.exe`
- La DLL debe ser de **64 bits** (x64) para que coincida con el runtime de .NET 8 x64
- El lector ZK9500 debe estar conectado por USB antes de abrir el dispositivo

## 🔧 Troubleshooting

Si aún hay errores después de estos cambios:

1. **Verificar que la DLL esté presente:**
   ```powershell
   dir D:\DiscoE\new-gym\biometric-service\bin\Release\net8.0\win-x64\publish\libzkfp.dll
   ```

2. **Verificar arquitectura de la DLL:**
   ```powershell
   dumpbin /headers libzkfp.dll | findstr machine
   ```
   Debería mostrar: `machine (x64)`

3. **Revisar logs del servicio:**
   - Los logs se guardan en la consola cuando se ejecuta manualmente
   - O en `C:\ProgramData\WolfGym\biometric\logs\` si está como servicio

## 📞 Soporte

Si el problema persiste, revisa:
- Que el dispositivo ZK9500 esté conectado
- Que los drivers del dispositivo estén instalados
- Los logs del servicio para errores más específicos



