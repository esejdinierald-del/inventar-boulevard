-- Fshij politikën restrictive ekzistuese
DROP POLICY IF EXISTS "Allow PIN verification for authenticated users" ON public.staff_turn_pins;

-- Krijo politikë PERMISSIVE (default) për lexim
CREATE POLICY "Allow PIN verification for authenticated users" 
ON public.staff_turn_pins 
FOR SELECT 
TO authenticated
USING (true);