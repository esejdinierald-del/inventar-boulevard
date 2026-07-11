CREATE TABLE IF NOT EXISTS public.shift_turns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date      DATE NOT NULL,
  staff_name      TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  turn_data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at       TIMESTAMPTZ,
  is_locked       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entry_date, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_shift_turns_date ON public.shift_turns(entry_date DESC, sequence_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_turns TO authenticated;
GRANT ALL ON public.shift_turns TO service_role;

ALTER TABLE public.shift_turns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view shift_turns"
  ON public.shift_turns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert shift_turns"
  ON public.shift_turns FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update shift_turns"
  ON public.shift_turns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete shift_turns"
  ON public.shift_turns FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_shift_turns_updated_at
  BEFORE UPDATE ON public.shift_turns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();