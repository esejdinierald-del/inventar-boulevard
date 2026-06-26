-- Allow authenticated users to manage staff_turn_pins (admin gate is client-side via password, matching pattern of products/expenses)
DROP POLICY IF EXISTS "Admin can view staff_turn_pins" ON public.staff_turn_pins;
DROP POLICY IF EXISTS "Admin can insert staff_turn_pins" ON public.staff_turn_pins;
DROP POLICY IF EXISTS "Admin can update staff_turn_pins" ON public.staff_turn_pins;
DROP POLICY IF EXISTS "Admin can delete staff_turn_pins" ON public.staff_turn_pins;

CREATE POLICY "Authenticated can view staff_turn_pins"
  ON public.staff_turn_pins FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert staff_turn_pins"
  ON public.staff_turn_pins FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update staff_turn_pins"
  ON public.staff_turn_pins FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete staff_turn_pins"
  ON public.staff_turn_pins FOR DELETE
  TO authenticated USING (true);