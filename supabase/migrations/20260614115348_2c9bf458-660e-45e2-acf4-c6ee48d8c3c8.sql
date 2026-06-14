-- 1) staff_turn_pins: missing GRANTs cause "permission denied"
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_turn_pins TO authenticated;
GRANT ALL ON public.staff_turn_pins TO service_role;

-- 2) products: missing GRANTs + restrictive RLS block staff auto-save
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;

DROP POLICY IF EXISTS "Authenticated can insert products" ON public.products;
CREATE POLICY "Authenticated can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;
CREATE POLICY "Authenticated can update products"
ON public.products FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);