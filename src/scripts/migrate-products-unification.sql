-- Migración para unificar el sistema de productos
-- Agregar campos para separar productos públicos vs gimnasio

-- 1. Agregar nuevos campos a InventoryItem
ALTER TABLE "InventoryItem" 
ADD COLUMN "isGymProduct" BOOLEAN DEFAULT false,
ADD COLUMN "category" TEXT;

-- 2. Actualizar DailyDebt para usar productos reales
ALTER TABLE "daily_debts" 
ADD COLUMN "productId" TEXT,
ADD CONSTRAINT "daily_debts_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "InventoryItem"("item_id") ON DELETE SET NULL;

-- 3. Crear índice para mejorar performance
CREATE INDEX "daily_debts_productId_idx" ON "daily_debts"("productId");

-- 4. Actualizar DebtHistory para mantener referencia al producto
ALTER TABLE "debt_history" 
ADD COLUMN "productId" TEXT;

-- 5. Hacer productName obligatorio en DailyDebt (ya no puede ser null)
ALTER TABLE "daily_debts" 
ALTER COLUMN "productName" SET NOT NULL;

-- 6. Eliminar la columna productType de DailyDebt (ya no se usa)
-- Nota: Comentado para evitar pérdida de datos. Ejecutar después de migrar datos existentes.
-- ALTER TABLE "daily_debts" DROP COLUMN "productType";

-- 7. Eliminar la columna productType de DebtHistory (ya no se usa)  
-- Nota: Comentado para evitar pérdida de datos. Ejecutar después de migrar datos existentes.
-- ALTER TABLE "debt_history" DROP COLUMN "productType";

-- 8. Insertar algunos productos de ejemplo para gimnasio
INSERT INTO "InventoryItem" (
  "item_id", 
  "item_name", 
  "item_description", 
  "item_price", 
  "item_stock", 
  "item_image_url", 
  "isGymProduct", 
  "category"
) VALUES 
  (gen_random_uuid(), 'Agua 500ml', 'Agua mineral 500ml', 1.50, 100, '/placeholder-water.png', true, 'agua'),
  (gen_random_uuid(), 'Agua 1L', 'Agua mineral 1 litro', 2.50, 50, '/placeholder-water.png', true, 'agua'),
  (gen_random_uuid(), 'Proteína Scoop', 'Porción de proteína en polvo', 5.00, 200, '/placeholder-protein.png', true, 'proteina'),
  (gen_random_uuid(), 'Pre-entreno Básico', 'Pre-entreno básico', 3.00, 80, '/placeholder-preworkout.png', true, 'pre-entreno'),
  (gen_random_uuid(), 'Pre-entreno Premium', 'Pre-entreno premium', 5.00, 60, '/placeholder-preworkout.png', true, 'pre-entreno'),
  (gen_random_uuid(), 'Pre-entreno Elite', 'Pre-entreno de alta gama', 10.00, 30, '/placeholder-preworkout.png', true, 'pre-entreno');

-- 9. Comentarios para el administrador
-- Después de ejecutar esta migración:
-- 1. Ejecutar: npx prisma generate
-- 2. Reiniciar el servidor de desarrollo
-- 3. Los productos existentes aparecerán como "públicos" (isGymProduct = false)
-- 4. Los nuevos productos de gimnasio ya estarán disponibles
-- 5. Puedes marcar productos existentes como "Solo para gimnasio" editándolos desde el admin
