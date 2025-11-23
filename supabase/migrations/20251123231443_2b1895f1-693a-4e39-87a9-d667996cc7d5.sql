-- Tabela për të ruajtur të dhënat ditore
CREATE TABLE IF NOT EXISTS public.daily_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  turn1_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  turn2_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_date)
);

-- Tabela për të ruajtur listën e produkteve
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela për të ruajtur stokun për ditën e ardhshme
CREATE TABLE IF NOT EXISTS public.next_day_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_date DATE NOT NULL UNIQUE,
  stock_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  mulliri_fillim INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela për të ruajtur mappings e produkteve nga faturë
CREATE TABLE IF NOT EXISTS public.product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_name TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL, -- 'product' ose 'coffee'
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes për performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON public.daily_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_next_day_stock_date ON public.next_day_stock(stock_date DESC);

-- Trigger për updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_entries_updated_at
  BEFORE UPDATE ON public.daily_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER next_day_stock_updated_at
  BEFORE UPDATE ON public.next_day_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER product_mappings_updated_at
  BEFORE UPDATE ON public.product_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies (publike për tani, pa autentifikim)
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.next_day_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;

-- Të gjithë mund të lexojnë dhe shkruajnë (pa autentifikim për tani)
CREATE POLICY "Enable all access for daily_entries" ON public.daily_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for next_day_stock" ON public.next_day_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for product_mappings" ON public.product_mappings FOR ALL USING (true) WITH CHECK (true);

-- Shto produktet default
INSERT INTO public.products (name, sort_order) VALUES
  ('Kanace', 1),
  ('Uje .vit', 2),
  ('Heineken shishe', 3),
  ('Korona', 4),
  ('Paulaner', 5),
  ('Rose', 6),
  ('Red.bull', 7),
  ('B 52', 8),
  ('Crodino', 9),
  ('Biter', 10),
  ('Bustina', 11),
  ('Uje', 12),
  ('Caj', 13),
  ('Caj bio', 14)
ON CONFLICT (name) DO NOTHING;