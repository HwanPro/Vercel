# 🏗️ Estructura de Repositorios - Wolf Gym

Este proyecto está dividido en **dos repositorios separados** para optimizar el despliegue y la gestión:

## 📁 Repositorios

### 1. 🌐 **Repositorio Principal (Web App)**
- **URL**: `https://github.com/HwanPro/Vercel.git`
- **Propósito**: Aplicación web Next.js para despliegue en Vercel
- **Contenido**: 
  - Frontend React/Next.js
  - API routes
  - Base de datos (Prisma)
  - Configuración de despliegue web

### 2. 🐍 **Repositorio Python Services**  
- **URL**: `https://github.com/HwanPro/Python.git`
- **Propósito**: Servicios Python para biometría y funciones del servidor
- **Contenido**:
  - Servicio de huellas dactilares (`fingerprint_service/`)
  - Servidor Python (`server.py`)
  - Configuración de servicios Python

## 🚀 Despliegue

### Web App (Vercel)
```bash
# Clona el repositorio principal
git clone https://github.com/HwanPro/Vercel.git
cd Vercel
npm install
npm run build
```

### Python Services (Servidor local/VPS)
```bash
# Clona el repositorio de Python por separado
git clone https://github.com/HwanPro/Python.git python-services
cd python-services
pip install -r requirements.txt
python server.py
```

## 🔗 Desarrollo Local

Para desarrollo local completo:

1. **Clon el repo principal** (este)
2. **Clon el repo Python** en la carpeta `python-services/`:
   ```bash
   git clone https://github.com/HwanPro/Python.git python-services
   ```
3. **Instala dependencias** de ambos:
   ```bash
   # Node.js dependencies
   npm install
   
   # Python dependencies  
   cd python-services
   pip install -r requirements.txt
   cd ..
   ```

## ⚠️ Importante

- La carpeta `python-services/` está en `.gitignore` del repo principal
- Cada repositorio se actualiza independientemente
- Los servicios Python deben ejecutarse por separado del servidor web

---
*Estructura optimizada para diferentes entornos de despliegue* 🎯
