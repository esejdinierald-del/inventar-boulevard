DROP POLICY IF EXISTS "Anyone can read alcohol deductions" ON public.alcohol_deductions;
CREATE POLICY "Authenticated can read alcohol deductions"
  ON public.alcohol_deductions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can read gjendje locks" ON public.gjendje_locks;
CREATE POLICY "Authenticated can read gjendje locks"
  ON public.gjendje_locks FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.alcohol_deductions FROM anon;
REVOKE SELECT ON public.gjendje_locks FROM anon;