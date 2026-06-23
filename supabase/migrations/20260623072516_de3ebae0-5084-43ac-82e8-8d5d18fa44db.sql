
-- FIX 3: Shto kolona për gjendje confirmed (sinkronizuar midis pajisjeve)
ALTER TABLE public.daily_entries
  ADD COLUMN IF NOT EXISTS gjendje_confirmed_t1 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gjendje_confirmed_t2 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gjendje_confirmed_t1_by text,
  ADD COLUMN IF NOT EXISTS gjendje_confirmed_t2_by text,
  ADD COLUMN IF NOT EXISTS gjendje_confirmed_t1_at timestamptz,
  ADD COLUMN IF NOT EXISTS gjendje_confirmed_t2_at timestamptz,
  ADD COLUMN IF NOT EXISTS gjendje_print_lock_t1_until timestamptz,
  ADD COLUMN IF NOT EXISTS gjendje_print_lock_t2_until timestamptz;

-- FIX 4: Idempotent alcohol_deductions table (që rideploy nuk e humb)
CREATE TABLE IF NOT EXISTS public.alcohol_deductions (
  entry_date       date        NOT NULL,
  turn_number      smallint    NOT NULL CHECK (turn_number IN (1, 2)),
  drink_name       text        NOT NULL,
  applied_quantity numeric     NOT NULL DEFAULT 0,
  source           text        DEFAULT 'receipt',
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_date, turn_number, drink_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alcohol_deductions TO authenticated;
GRANT ALL ON public.alcohol_deductions TO service_role;

ALTER TABLE public.alcohol_deductions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'alcohol_deductions'
      AND policyname = 'Authenticated users can access alcohol_deductions'
  ) THEN
    CREATE POLICY "Authenticated users can access alcohol_deductions"
      ON public.alcohol_deductions FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_alcohol_deductions_date
  ON public.alcohol_deductions (entry_date);
