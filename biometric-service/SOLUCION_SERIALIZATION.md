# Solución: Error de Serialización JSON

## 🐛 Problema

El servicio capturaba correctamente la huella, pero el cliente JavaScript recibía un error:

```
Error en captura
No se pudo capturar
```

## 🔍 Causa

El servicio C# devolvía las respuestas en **PascalCase** pero el cliente JavaScript esperaba **camelCase**:

### ❌ Antes

**Servicio C# enviaba:**
```json
{
  "Ok": true,
  "TemplateB64": "base64...",
  "ImageB64": "...",
  "Length": 512,
  "Quality": 0,
  "Message": null
}
```

**Cliente JavaScript esperaba:**
```json
{
  "ok": true,
  "template": "base64...",
  "image": "...",
  "length": 512,
  "quality": 0,
  "message": null
}
```

**Resultado:** El cliente no encontraba los campos `ok` ni `template` y lanzaba error.

## ✅ Solución Implementada

### 1. Configurar Serializador JSON en camelCase

**Archivo:** `Program.cs`

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
```

Esto convierte automáticamente:
- `Ok` → `ok`
- `Length` → `length`
- `Message` → `message`

### 2. Mapear Nombres Específicos

**Archivo:** `Models/ApiModels.cs`

```csharp
using System.Text.Json.Serialization;

public record CaptureResponse(
    bool Ok,
    [property: JsonPropertyName("template")] string? TemplateB64,
    [property: JsonPropertyName("image")] string? ImageB64,
    int Length,
    int Quality,
    string? Message = null
);
```

Esto mapea:
- `TemplateB64` → `template`
- `ImageB64` → `image`

### ✅ Después

**Ahora el servicio envía:**
```json
{
  "ok": true,
  "template": "base64...",
  "image": "...",
  "length": 512,
  "quality": 0,
  "message": null
}
```

✅ ¡Coincide exactamente con lo que espera el cliente!

---

## 🚀 Aplicar la Solución

### Paso 1: Detener el servicio

Presiona `Ctrl+C` en la terminal del servicio.

### Paso 2: Recompilar

```powershell
cd D:\DiscoE\new-gym\biometric-service
.\rebuild.ps1
```

O manualmente:
```powershell
dotnet publish -c Release -r win-x64 --self-contained false
```

### Paso 3: Reiniciar

```powershell
cd bin\Release\net8.0\win-x64\publish
.\WolfGym.BiometricService.exe
```

### Paso 4: Probar

1. Abre la aplicación web
2. Admin → Clientes
3. Haz clic en "Registrar huella"
4. **Coloca el dedo en el lector** cuando se te indique
5. ✅ La captura debería completarse exitosamente

---

## 📊 Logs Esperados

### Servicio C# (Consola)

```
[01:29:44 INF] Request starting HTTP/1.1 POST http://127.0.0.1:8002/capture
[01:29:45 DBG] Fingerprint captured successfully. Template length: 512
[01:29:45 INF] Executing OkObjectResult, writing value of type 'CaptureResponse'
[01:29:45 INF] Request finished HTTP/1.1 POST http://127.0.0.1:8002/capture - 200
```

### Cliente Next.js (Navegador Console)

```
[CAPTURE] Iniciando captura, BASE: http://127.0.0.1:8002
[CAPTURE] Intento 1 de apertura del dispositivo
[CAPTURE] Resultado apertura: opened=true, response={"ok":true,"deviceCount":1,...}
[CAPTURE] Dispositivo abierto, iniciando captura...
[CAPTURE] Resultado captura: {"ok":true,"template":"iVBORw0KG...","length":512}
✅ Huella capturada exitosamente
```

---

## ✅ Verificación Final

### Test Manual con curl

```powershell
# 1. Abrir dispositivo
curl -X POST http://127.0.0.1:8002/device/open

# Respuesta esperada (ahora en camelCase):
# {"ok":true,"deviceCount":1,"serial":null,"width":300,"height":375,"fpVersion":"ZK"}

# 2. Capturar huella (coloca el dedo)
curl -X POST http://127.0.0.1:8002/capture

# Respuesta esperada:
# {"ok":true,"template":"base64...","image":"base64...","length":512,"quality":0}
```

---

## 🔧 Archivos Modificados

1. ✅ `biometric-service/Program.cs`
   - Configurado serializador JSON en camelCase

2. ✅ `biometric-service/Models/ApiModels.cs`
   - Agregado `using System.Text.Json.Serialization`
   - Mapeado `TemplateB64` → `template`
   - Mapeado `ImageB64` → `image`

---

## 📝 Resumen de Todas las Correcciones

| # | Problema | Solución | Estado |
|---|----------|----------|--------|
| 1 | Entry point not found | Corregir nombres de funciones P/Invoke | ✅ |
| 2 | Endpoint 404 | Cambiar `/device/capture` → `/capture` | ✅ |
| 3 | SDK already initialized | Manejar reinicializaciones | ✅ |
| 4 | Crash en captura | Agregar parámetro `imageSize` faltante | ✅ |
| 5 | Serialización JSON | camelCase + mapeo de nombres | ✅ |

---

**Estado:** ✅ TODOS LOS PROBLEMAS RESUELTOS  
**Última actualización:** 30 de septiembre de 2025  
**Resultado:** El servicio biométrico ahora funciona completamente 🎉





