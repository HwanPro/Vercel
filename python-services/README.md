# 🔬 Servicio de Huellas Dactilares - Wolf Gym

## 🚀 **Instalación Rápida**

### **1. Descargar Cambios**
```bash
git pull
```

### **2. Configuración Inicial (Solo la primera vez)**
```bash
cd python-services
setup.bat
```

### **3. Iniciar Servicio**
```bash
run_service.bat
```

## ⚙️ **Configuración**

### **Archivo .env**
Edita el archivo `.env` con tu configuración:

```bash
# Tu base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@localhost:5432/gym_db

# Configuración de huellas (NO CAMBIAR)
ZK_MATCH_THRESHOLD=98
ZK_FORCE_FALLBACK=true
ZK_DEBUG_LOGGING=true
```

## 🔧 **Uso Diario**

### **Iniciar el Servicio**
1. Doble clic en `run_service.bat`
2. El servicio estará en: http://127.0.0.1:8001
3. Mantén la ventana abierta mientras uses el gimnasio

### **Detener el Servicio**
- Presiona `Ctrl + C` en la ventana del servicio
- O simplemente cierra la ventana

## 🆘 **Solución de Problemas**

### **Error: "Python no encontrado"**
- Instala Python desde: https://www.python.org/downloads/
- Marca "Add Python to PATH" durante la instalación

### **Error: "Base de datos no disponible"**
- Verifica que PostgreSQL esté ejecutándose
- Revisa la URL en el archivo `.env`

### **Error: "Puerto 8001 ocupado"**
- Cierra otras instancias del servicio
- Reinicia tu computadora si es necesario

## 📞 **Soporte**

Si tienes problemas:
1. Toma captura de pantalla del error
2. Contacta al desarrollador
3. Incluye el archivo `fingerprint_monitor.log` si existe

## 🔄 **Actualizaciones**

Para obtener nuevas versiones:
```bash
git pull
```

El servicio se actualizará automáticamente sin perder tu configuración.
