-- 1. Asegurar que la columna 'description' exista (Causa principal de errores al guardar)
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- 2. Eliminar cualquier restricción de categoría antigua (Causa error "violates check constraint")
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- 3. Asegurar que 'category' sea texto libre para aceptar 'Agua y Refrescos', etc.
ALTER TABLE products ALTER COLUMN category TYPE text;

-- 4. Permitir ventas manuales (Sin ID de producto)
ALTER TABLE sale_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS unit_cost numeric DEFAULT 0;

-- 5. REPARAR PERMISOS (RLS) - Si esto está mal configurado, nadie puede guardar nada
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en productos" ON products;
CREATE POLICY "Permitir todo en productos" ON products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en ventas" ON sales;
CREATE POLICY "Permitir todo en ventas" ON sales FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en sale_items" ON sale_items;
CREATE POLICY "Permitir todo en sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);

-- 6. Normalizar categorías antiguas para que aparezcan en los filtros nuevos
UPDATE products SET category = 'Abarrotes' WHERE category IS NULL OR category = 'GEN';
