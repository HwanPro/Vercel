-- Migración manual para actualizar tabla fingerprints
-- De: user_id UNIQUE
-- A: (user_id, finger_index) UNIQUE

BEGIN;

-- 1. Eliminar el constraint único de user_id
ALTER TABLE fingerprints DROP CONSTRAINT IF EXISTS fingerprints_user_id_key;

-- 2. Agregar nuevas columnas si no existen
ALTER TABLE fingerprints 
  ADD COLUMN IF NOT EXISTS finger_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS version TEXT,
  ADD COLUMN IF NOT EXISTS device_serial TEXT,
  ADD COLUMN IF NOT EXISTS quality INTEGER,
  ADD COLUMN IF NOT EXISTS template_size INTEGER DEFAULT 0;

-- 3. Actualizar datos existentes (si hay alguno)
UPDATE fingerprints 
SET finger_index = 0, 
    template_size = length(template)
WHERE finger_index IS NULL OR template_size = 0;

-- 4. Hacer finger_index NOT NULL
ALTER TABLE fingerprints 
  ALTER COLUMN finger_index SET NOT NULL,
  ALTER COLUMN template_size SET NOT NULL;

-- 5. Crear el nuevo constraint único
ALTER TABLE fingerprints 
  ADD CONSTRAINT fingerprints_user_id_finger_index_key 
  UNIQUE (user_id, finger_index);

-- 6. Crear índice adicional en user_id
CREATE INDEX IF NOT EXISTS fingerprints_user_id_idx ON fingerprints(user_id);

COMMIT;

-- Verificación
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fingerprints' 
ORDER BY ordinal_position;
