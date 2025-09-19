-- Script de migración manual para agregar tablas de deudas
-- Ejecutar este script directamente en la base de datos

-- Crear enum para tipos de productos
DO $$ BEGIN
    CREATE TYPE "ProductType" AS ENUM (
        'WATER_1_5',
        'WATER_2_5', 
        'WATER_3_5',
        'PROTEIN_5',
        'PRE_WORKOUT_3',
        'PRE_WORKOUT_5',
        'PRE_WORKOUT_10',
        'CUSTOM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla de deudas diarias
CREATE TABLE IF NOT EXISTS "daily_debts" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "productName" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "daily_debts_pkey" PRIMARY KEY ("id")
);

-- Crear tabla de historial de deudas
CREATE TABLE IF NOT EXISTS "debt_history" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "productName" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "debtType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "debt_history_pkey" PRIMARY KEY ("id")
);

-- Crear índices
CREATE INDEX IF NOT EXISTS "daily_debts_clientProfileId_createdAt_idx" ON "daily_debts"("clientProfileId", "createdAt");
CREATE INDEX IF NOT EXISTS "debt_history_clientProfileId_createdAt_idx" ON "debt_history"("clientProfileId", "createdAt");

-- Agregar claves foráneas
DO $$ BEGIN
    ALTER TABLE "daily_debts" ADD CONSTRAINT "daily_debts_clientProfileId_fkey" 
    FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("profile_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "debt_history" ADD CONSTRAINT "debt_history_clientProfileId_fkey" 
    FOREIGN KEY ("clientProfileId") REFERENCES "ClientProfile"("profile_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verificar que las tablas se crearon correctamente
SELECT 
    'daily_debts' as table_name,
    COUNT(*) as record_count
FROM daily_debts
UNION ALL
SELECT 
    'debt_history' as table_name,
    COUNT(*) as record_count
FROM debt_history;
