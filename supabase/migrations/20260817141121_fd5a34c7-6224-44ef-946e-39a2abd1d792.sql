CREATE POLICY "Authenticated can update product_mappings" ON public.product_mappings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete product_mappings" ON public.product_mappings FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_mappings TO authenticated;
GRANT ALL ON public.product_mappings TO service_role;