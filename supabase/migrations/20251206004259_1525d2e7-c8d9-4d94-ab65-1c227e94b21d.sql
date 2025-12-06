-- Drop existing permissive policies and create restrictive ones requiring authentication

-- staff_turn_pins: Only authenticated users can access
DROP POLICY IF EXISTS "Allow all operations on staff_turn_pins" ON public.staff_turn_pins;
CREATE POLICY "Authenticated users can view staff_turn_pins"
  ON public.staff_turn_pins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert staff_turn_pins"
  ON public.staff_turn_pins FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update staff_turn_pins"
  ON public.staff_turn_pins FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete staff_turn_pins"
  ON public.staff_turn_pins FOR DELETE
  TO authenticated
  USING (true);

-- daily_entries: Only authenticated users can access
DROP POLICY IF EXISTS "Enable all access for daily_entries" ON public.daily_entries;
CREATE POLICY "Authenticated users can view daily_entries"
  ON public.daily_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert daily_entries"
  ON public.daily_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily_entries"
  ON public.daily_entries FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete daily_entries"
  ON public.daily_entries FOR DELETE
  TO authenticated
  USING (true);

-- next_day_stock: Only authenticated users can access
DROP POLICY IF EXISTS "Enable all access for next_day_stock" ON public.next_day_stock;
CREATE POLICY "Authenticated users can view next_day_stock"
  ON public.next_day_stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert next_day_stock"
  ON public.next_day_stock FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update next_day_stock"
  ON public.next_day_stock FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete next_day_stock"
  ON public.next_day_stock FOR DELETE
  TO authenticated
  USING (true);

-- daily_entry_history: Only authenticated users can access
DROP POLICY IF EXISTS "Allow public insert access" ON public.daily_entry_history;
DROP POLICY IF EXISTS "Allow public read access" ON public.daily_entry_history;
CREATE POLICY "Authenticated users can view daily_entry_history"
  ON public.daily_entry_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert daily_entry_history"
  ON public.daily_entry_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- alcoholic_drinks_inventory: Only authenticated users can access
DROP POLICY IF EXISTS "Enable all access for alcoholic_drinks_inventory" ON public.alcoholic_drinks_inventory;
CREATE POLICY "Authenticated users can view alcoholic_drinks_inventory"
  ON public.alcoholic_drinks_inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert alcoholic_drinks_inventory"
  ON public.alcoholic_drinks_inventory FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alcoholic_drinks_inventory"
  ON public.alcoholic_drinks_inventory FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete alcoholic_drinks_inventory"
  ON public.alcoholic_drinks_inventory FOR DELETE
  TO authenticated
  USING (true);

-- expenses: Only authenticated users can access
DROP POLICY IF EXISTS "Enable all access for expenses" ON public.expenses;
CREATE POLICY "Authenticated users can view expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (true);

-- product_mappings: Only authenticated users can access
DROP POLICY IF EXISTS "Enable all access for product_mappings" ON public.product_mappings;
CREATE POLICY "Authenticated users can view product_mappings"
  ON public.product_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert product_mappings"
  ON public.product_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product_mappings"
  ON public.product_mappings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete product_mappings"
  ON public.product_mappings FOR DELETE
  TO authenticated
  USING (true);

-- invoice_mappings: Only authenticated users can access
DROP POLICY IF EXISTS "Allow all operations on invoice_mappings" ON public.invoice_mappings;
CREATE POLICY "Authenticated users can view invoice_mappings"
  ON public.invoice_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert invoice_mappings"
  ON public.invoice_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoice_mappings"
  ON public.invoice_mappings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete invoice_mappings"
  ON public.invoice_mappings FOR DELETE
  TO authenticated
  USING (true);

-- products: Keep public read, authenticated for write
DROP POLICY IF EXISTS "Enable all access for products" ON public.products;
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- coffee_types: Keep public read, authenticated for write
DROP POLICY IF EXISTS "Enable all access for coffee_types" ON public.coffee_types;
CREATE POLICY "Anyone can view coffee_types"
  ON public.coffee_types FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert coffee_types"
  ON public.coffee_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update coffee_types"
  ON public.coffee_types FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete coffee_types"
  ON public.coffee_types FOR DELETE
  TO authenticated
  USING (true);

-- kitchen_products: Keep public read, authenticated for write
DROP POLICY IF EXISTS "Enable all access for kitchen_products" ON public.kitchen_products;
CREATE POLICY "Anyone can view kitchen_products"
  ON public.kitchen_products FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert kitchen_products"
  ON public.kitchen_products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update kitchen_products"
  ON public.kitchen_products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete kitchen_products"
  ON public.kitchen_products FOR DELETE
  TO authenticated
  USING (true);