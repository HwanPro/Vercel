-- Añade columnas faltantes con DEFAULT para no romper filas existentes
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'gym';
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "stationId" TEXT;

-- createdAt / updatedAt requeridas con default
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now();
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now();

-- Nota:
-- La columna de duración ya existe como "duration";
-- en el schema la mapeamos con @map("duration"), así que NO se crea nada aquí.
