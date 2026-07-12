DROP POLICY IF EXISTS "shift_turns_all_anon" ON public.shift_turns;
DROP POLICY IF EXISTS "shift_turns_all_auth" ON public.shift_turns;

CREATE POLICY "shift_turns_all_anon"
  ON public.shift_turns FOR ALL
  TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "shift_turns_all_auth"
  ON public.shift_turns FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_turns TO anon, authenticated;