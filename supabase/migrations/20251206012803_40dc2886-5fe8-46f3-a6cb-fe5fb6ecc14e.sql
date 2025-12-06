-- Shto politikë që lejon leximin e staff_turn_pins për verifikim
-- Kjo nevojitet për të lejuar verifikimin e PIN-it

-- Së pari, fshij politikën ekzistuese nëse ekziston
DROP POLICY IF EXISTS "Allow PIN verification" ON public.staff_turn_pins;
DROP POLICY IF EXISTS "Authenticated users can view staff_turn_pins" ON public.staff_turn_pins;

-- Krijo politikë të re që lejon lexim për të gjithë userat e autentifikuar (përfshirë anonim)
CREATE POLICY "Allow PIN verification for authenticated users" 
ON public.staff_turn_pins 
FOR SELECT 
TO authenticated
USING (true);