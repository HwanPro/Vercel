# Wolf Gym – Monorepo Guide (App + Fingerprint Service)

Este repositorio contiene la aplicación web principal (Next.js). El servicio de huellas dactilares (python-services) vive en un repositorio SEPARADO y no se versiona dentro de este repo (está ignorado por `.gitignore`).

La idea es que tanto tú como tu cliente puedan actualizar cada proyecto con un simple `git pull`, sin compartir entornos ni configuraciones locales.

---

## Estructura y Repositorios

- App Web (este repo)
  - Framework: Next.js (TypeScript)
  - Ruta: raíz del repo
  - Producción: Vercel u otro hosting

- Servicio de Huellas – python-services (OTRO repo)
  - Framework: FastAPI (Python)
  - Ruta local sugerida: fuera de este repo
  - Ejecución local: Windows (scripts .bat incluidos en su propio repo)

> Nota: En este repo, la carpeta `python-services/` está listada en `.gitignore` para evitar push accidentales.

---

## 1) App Web (Next.js)

### Requisitos
- Node.js 18+
- pnpm, npm o yarn

### Variables de entorno
Crear un archivo `.env.local` en la raíz de la app con tus credenciales. Ejemplos (ajusta a tu entorno):

```bash
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/gym_db
AWS_BUCKET_NAME=tu-bucket
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_live_xxx_o_test
```

### Instalar y correr
```bash
npm install
npm run dev
# abre http://localhost:3000
```

### Producción
- Vercel (recomendado) o el proveedor que prefieras.
- Recuerda configurar las mismas variables de entorno en el panel de tu hosting.

---

## 2) Servicio de Huellas (python-services) – Repo independiente

Este servicio NO está en este repo. Se entrega como un proyecto aparte. La guía de uso para tu cliente está incluida en el propio repo del servicio (README, setup.bat y run_service.bat).

### Pasos típicos para tu cliente
1. Clonar o actualizar el repo del servicio:
   ```bash
   git pull
   ```
2. Ejecutar configuración inicial (solo 1ra vez):
   ```bash
   setup.bat
   ```
3. Iniciar el servicio local:
   ```bash
   run_service.bat
   ```
4. El servicio queda en: `http://127.0.0.1:8001`

### Variables de entorno (archivo .env en el repo python-services)
```bash
DATABASE_URL=postgresql://usuario:password@localhost:5432/gym_db
ZK_MATCH_THRESHOLD=98
ZK_FORCE_FALLBACK=true
ZK_DEBUG_LOGGING=true
```

> Cada PC puede tener su propia `DATABASE_URL` sin afectar a los demás. Los scripts ya crean `.env` desde `config.env.example` si falta.

---

## 3) Flujo de actualizaciones (para tu cliente)

- App Web (este repo):
  ```bash
  git pull
  npm run build # según hosting
  ```

- Servicio de Huellas (repo aparte):
  ```bash
  git pull
  run_service.bat
  ```

No es necesario tocar código ni reconfigurar rutas. Solo mantener `.env` de cada proyecto con su propia conexión.

---

## 4) Desarrollo local – tips

- La API pública de productos está en `src/app/api/products/public/route.ts`.
- Campos para visibilidad:
  - `is_admin_only` = true => NO aparece en catálogo público.
- Prisma schema: `prisma/schema.prisma`.

---

## 5) Soporte rápido

- Problemas con App Web: revisar consola/`/api/*` y variables en `.env.local`.
- Problemas con Servicio de Huellas: ejecutar `setup.bat`, revisar `.env` y puertos libres (8001).

---

## 6) Changelog breve (últimos cambios relevantes)

- SEO mejorado (metas, OG/Twitter, schema.org) en `src/app/layout.tsx` y estructura semántica en `src/app/page.tsx`.
- Productos “solo gimnasio”: endpoint público filtra `is_admin_only=false`.
- Modal de “Agregar Producto”: UI mejorada y botón cerrar corregido.
- python-services: endurecido el algoritmo de similitud y scripts de instalación/arranque.

