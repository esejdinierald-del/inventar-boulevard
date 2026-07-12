-- GRANTs for shift_turns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_turns TO anon, authenticated;
GRANT ALL ON public.shift_turns TO service_role;

-- Ensure RLS enabled
ALTER TABLE public.shift_turns ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent)
DROP POLICY IF EXISTS "shift_turns read all" ON public.shift_turns;
CREATE POLICY "shift_turns read all"
  ON public.shift_turns FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shift_turns insert all" ON public.shift_turns;
CREATE POLICY "shift_turns insert all"
  ON public.shift_turns FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "shift_turns update unlocked" ON public.shift_turns;
CREATE POLICY "shift_turns update unlocked"
  ON public.shift_turns FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS shift_turns_entry_date_idx
  ON public.shift_turns (entry_date, sequence_number);