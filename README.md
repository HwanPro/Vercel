# Wolf Gym

Aplicacion web de gestion para Wolf Gym (Next.js + Prisma + NextAuth) con panel admin, check-in, reportes e integracion biometrica.

## Stack
- Next.js 15 (App Router)
- TypeScript
- Prisma + PostgreSQL
- NextAuth (credenciales)
- Tailwind CSS

## Requisitos
- Node.js 18+
- npm
- Base de datos PostgreSQL

## Variables de entorno
Configura `.env` con al menos:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

AWS_REGION=...
AWS_BUCKET_NAME=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

NEXT_PUBLIC_CULQI_PUBLIC_KEY=...
EMAIL_USER=...
EMAIL_PASS=...
```

## Desarrollo
```bash
npm install
npm run dev
```

Si aparece error de cache de Next (`routes-manifest.json`, `ENOENT` en `.next`):

```bash
npm run dev:clean
```

## Build de produccion
```bash
npm run build
npm run start
```

Nota en Windows: si Prisma falla con `EPERM ... query_engine-windows.dll.node`, cierra procesos `node` en segundo plano y vuelve a ejecutar `npm run build`.

## Panel Admin
Rutas principales:
- `/admin/dashboard`
- `/admin/profile`
- `/admin/reportes`
- `/admin/clients`
- `/admin/products`

Incluye:
- metricas de negocio
- gestion de clientes/productos
- perfil de administrador
- reportes con inconsistencias de datos

## Reportes
`/admin/reportes` consume `GET /api/admin/reports` y muestra:
- overview de ingresos, asistencia y membresias
- tendencias de ingresos y asistencia
- estado de inventario
- deudas
- inconsistencias (planes faltantes, fechas invalidas, stock negativo, precios invalidos, telefonos duplicados, etc.)

## Perfil Admin
`/admin/profile` permite visualizar y editar datos del administrador usando `ProfileModal`.
Endpoint usado:
- `GET /api/admin/me` (retorna solo campos seguros)

## Integracion biometrica (resumen)
La aplicacion se integra con un servicio biometrico local en `biometric-service/`.
Flujo esperado:
1. levantar servicio biometrico local
2. app consulta endpoints biometria (`/api/biometric/*`)
3. registrar/verificar huella por usuario

## Scripts utiles
```bash
npm run dev
npm run dev:clean
npm run build
npm run start
npm run lint
npm run cleanup:daily
npm run cleanup:weekly
npm run cleanup:both
npm run seed:complete
```

## Solucion rapida de fallas comunes
- Pantalla en blanco o 500 en admin durante desarrollo: `npm run dev:clean`.
- Botones sin respuesta por recarga de pagina: revisar sesion y evitar `window.location.reload`; usar refresco de datos via fetch.
- Endpoint admin devuelve 401: verificar sesion y rol `admin`.

## Licencia
Uso interno de Wolf Gym.
