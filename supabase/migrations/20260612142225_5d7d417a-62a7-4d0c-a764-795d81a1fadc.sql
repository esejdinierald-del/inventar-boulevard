-- Paketa 1: Alkohol idempotence + Gjendje locks në server

-- 1) Alcohol deductions ledger: ruan sasinë e aplikuar për (datë, turn, pije)
CREATE TABLE public.alcohol_deductions (
  entry_date date NOT NULL,
  turn_number smallint NOT NULL CHECK (turn_number IN (1,2)),
  drink_name text NOT NULL,
  applied_quantity numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'receipt',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_date, turn_number, drink_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alcohol_deductions TO authenticated;
GRANT SELECT ON public.alcohol_deductions TO anon;
GRANT ALL ON public.alcohol_deductions TO service_role;

ALTER TABLE public.alcohol_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read alcohol deductions"
  ON public.alcohol_deductions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can write alcohol deductions"
  ON public.alcohol_deductions FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);


-- 2) Gjendje locks: kur stafi konfirmon numërimin, ruhet në server jo localStorage
CREATE TABLE public.gjendje_locks (
  entry_date date NOT NULL,
  turn_number smallint NOT NULL CHECK (turn_number IN (1,2)),
  confirmed_by text,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_date, turn_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gjendje_locks TO authenticated;
GRANT SELECT ON public.gjendje_locks TO anon;
GRANT ALL ON public.gjendje_locks TO service_role;

ALTER TABLE public.gjendje_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gjendje locks"
  ON public.gjendje_locks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can write gjendje locks"
  ON public.gjendje_locks FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);