# Wolf Gym - Monorepo (App + Fingerprint Service)

## Panorama general
- Aplicacion principal: Next.js + TypeScript en la raiz del repo.
- Servicio de huellas (python-services): proyecto FastAPI independiente; se incluye aqui solo como referencia local.
- Objetivo: que el equipo y el cliente puedan actualizar cada pieza con `git pull` y mantener configuraciones aisladas.

## Estructura y repositorios
- `.`: aplicacion web, despliegue sugerido en Vercel u otro hosting con Node 18+.
- `python-services/`: servicio biometrico, se recomienda alojarlo en un repo separado y ejecutarlo en Windows mediante scripts `.bat`.
- `src/`: codigo de la app (APIs, UI, Prisma, scripts).

## Configuracion rapida

### App web (Next.js)
1. Requisitos: Node 18+, npm/pnpm/yarn.
2. Variables (`.env.local`):
   ```bash
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL=postgresql://usuario:password@localhost:5432/gym_db
   AWS_BUCKET_NAME=tu-bucket
   AWS_REGION=sa-east-1
   AWS_ACCESS_KEY_ID=xxxx
   AWS_SECRET_ACCESS_KEY=xxxx
   NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_test_o_prod
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASS=tu-contrasena-de-aplicacion
   ```
3. Instalacion y desarrollo:
   ```bash
   npm install
   npm run dev
   # abre http://localhost:3000
   ```
4. Produccion: `npm run build` y configura las mismas variables en el proveedor.

### Servicio de huellas (python-services)
1. Actualiza el repo local: `git pull`.
2. Primera vez: `setup.bat` (instala dependencias y crea `.env`).
3. Ejecucion diaria: `run_service.bat` (expone `http://127.0.0.1:8001`).
4. `.env` recomendado:
   ```bash
   DATABASE_URL=postgresql://usuario:password@localhost:5432/gym_db
   ZK_MATCH_THRESHOLD=98
   ZK_FORCE_FALLBACK=true
   ZK_DEBUG_LOGGING=true
   ```
5. Problemas comunes:
   - Python no encontrado: reinstala Python 3.11+ y marca "Add to PATH".
   - Puerto 8001 en uso: cierra instancias previas o reinicia.

## Sistemas clave

### Gestion de deudas
- Modelos Prisma (`DailyDebt`, `DebtHistory`, enum `ProductType`) documentados en `prisma/schema.prisma`.
- APIs: `POST/GET/DELETE /api/debts`, `POST/DELETE /api/debts/cleanup`, `POST /api/admin/cleanup`, `POST /api/check-in` (devuelve totales actualizados).
- UI admin:
  - `/check-in`: modo administrador con pantalla dividida, stream en tiempo real, dialogo para agregar productos rapidos o personalizados.
  - `/admin/clients`: columna "Deudas" con boton "Gestionar" que abre `DebtManagement` (resumen, historial, eliminar, agregar).
- Limpieza automatica:
  - Scripts npm: `npm run cleanup:daily`, `npm run cleanup:weekly`, `npm run cleanup:both`.
  - Cron sugerido:
    ```bash
    0 0 * * * cd /ruta/app && npm run cleanup:daily
    0 2 * * 0 cd /ruta/app && npm run cleanup:weekly
    ```
- Mantenimiento: revisar logs de procesos y ajustar precios en `PRODUCT_PRICES` dentro de `/api/debts/route.ts` si cambian.

### Catalogo de productos unificado
- Campos nuevos en `InventoryItem`: `isGymProduct`, `category`, relacion `dailyDebts`.
- Formulario admin (`AddProductDialog`): checkbox "Solo para gimnasio" y selector de categoria (agua, proteina, pre-entreno, suplementos, snacks, otros).
- API `GET /api/products/gym`: solo productos con `isGymProduct=true`, ordenados por categoria y nombre.
- `DebtManagement` usa productos reales con control de stock, colores por categoria y precios actuales.
- Script `src/scripts/migrate-products-unification.sql` agrega campos y datos iniciales.

### Sistema de rutinas tipo Strong
- Nuevos modelos Prisma: `Exercise`, `ExerciseMedia`, `ProgramTemplate`, `RoutineTemplate`, `RoutineItem`, `UserProgramAssignment`, `UserRoutineAssignment`, `WorkoutSession`, `WorkoutExercise`, `WorkoutSet`, `ExerciseProgressSuggestion`.
- APIs admin: crear/listar ejercicios (`/api/exercises`), gestionar media, registrar programas (`/api/programs`), rutinas (`/api/routines` y `/api/routines/:id/items`), y asignar rutinas o programas a usuarios (`/api/assign/*`).
- APIs cliente: registrar sesiones (`POST /api/workouts`), agregar ejercicios y series, completar entrenamientos, consultar historico (`/api/workouts/recent`) y obtener sugerencias de progresion (`/api/suggestions/next`).
- RoutineTab renovada: biblioteca de ejercicios con media, inicio guiado de entrenamientos y estadisticas de progreso; valida suscripciones activas y aplica roles.
- Seeds incluidos (`prisma/seed`): 10 ejercicios base listos con descripciones, RPE y media de referencia.
- Motor de progresion: calcula 1RM (Epley), genera sugerencias segun RPE, detecta PR y guarda historial de rendimiento.
- Pasos rapidos para habilitar el modulo:
  ```bash
  npx prisma db push
  npx prisma db seed
  ```
- Interfaces admin especializadas (gestores visuales de rutinas) quedan pendientes; todo el backend y la pestana de cliente estan operativos.

### Sistema biometrico (python-services)
- Algoritmo de similitud ahora usa solo Hamming distance, valida tamanos con tolerancia 20% y penalizacion adicional.
- `MATCH_THRESHOLD` elevado a 98 (configurable via `ZK_MATCH_THRESHOLD`).
- Identificacion 1:N valida candidatos: requiere diferencia minima de 3-5 puntos entre el primer y segundo resultado antes de aceptar una coincidencia.
- Logging detallado (`[FINGERPRINT_LOG]`) imprime hashes, tamanos y puntajes para auditoria.
- Scripts auxiliares: `test_fingerprint_accuracy.py`, `cleanup_fingerprints.py`.

### Correo electronico y notificaciones
- Notificaciones de vencimiento: `POST /api/notifications/sendEmails` (usa `EMAIL_USER`/`EMAIL_PASS`).
- Verificacion de email/username: `POST /api/auth/verify-email` (opcionalmente `SMTP_*`).
- Plantillas HTML responsivas ubicadas en `src/lib/email/templates` (revisar para personalizar branding).
- Scripts de prueba manual (carpeta raiz):
  ```bash
  node test-email-config.js
  node test-notifications-only.js
  node test-email-functions.js
  ```
- Para Gmail: habilita 2FA, genera contrasena de aplicacion de 16 caracteres y colocala en `EMAIL_PASS`.

### Experiencia de usuario y correcciones recientes
- Modales SweetAlert2 ahora aparecen sobre Radix Dialog ocultando temporalmente el overlay; CSS global asegura jerarquia (`z-index` 10000).
- API de deudas acepta productos existentes mapeando nombres a `ProductType`; evita error 400.
- `api/biometric/status/[id]` prioriza la base de datos y reporta fuentes (`inDatabase`, `inBiometricService`).
- `api/products/gym` filtra por palabras clave y provee categorias coherentes.

## Mantenimiento y tareas sugeridas
- Revisar semanalmente los resultados de `cleanup` y el crecimiento de `DebtHistory`.
- Antes de limpiezas masivas: respaldo de la base de datos.
- Cuando decidas completar la migracion unificada: ejecutar `psql -f src/scripts/migrate-products-unification.sql` y `npx prisma generate`.
- Ajustar precios o nuevos productos actualizando enum/semillas segun necesidad.
- Mantener `python-services` en repo separado para facilitar despliegue independiente.

## Verificaciones rapidas
- `npm run lint` y `npm run test` (cuando existan pruebas) para validar cambios en la app.
- `npm run cleanup:both -- --dry-run` (si agregas flag) para observar logica sin afectar datos.
- `test-email-config.js` para confirmar credenciales SMTP tras cambios.
- Logs del servicio de huellas: revisar `fingerprint_monitor.log` cuando haya dudas de coincidencias.

## Soporte y futuras mejoras
- Problemas comunes: revisar consola del navegador, logs de `/api/*` y valores de `.env`.
- Ideas pendientes: dashboard de analytics de deudas, notificaciones automaticas por saldo alto, exportes PDF/Excel y app movil de administracion.
- Contacto: adjunta capturas y logs relevantes (API o servicio biometrico) al pedir ayuda.

## Cambios destacados recientes
- SEO y metadatos mejorados en `src/app/layout.tsx` y `src/app/page.tsx`.
- Endpoint publico de productos filtra por `is_admin_only=false`.
- Modal "Agregar producto" corregido con cierre consistente.
- Servicio biometrico endurecido, scripts `.bat` listos para cliente final.

