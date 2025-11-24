-- Tabela per pijet alkoolike
CREATE TABLE IF NOT EXISTS public.alcoholic_drinks_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drink_name TEXT NOT NULL,
  furnizime INTEGER NOT NULL DEFAULT 0,
  shitje INTEGER NOT NULL DEFAULT 0,
  gjendje INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alcoholic_drinks_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies - lejo akses te plote
CREATE POLICY "Enable all access for alcoholic_drinks_inventory" 
ON public.alcoholic_drinks_inventory 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Trigger per updated_at
CREATE TRIGGER update_alcoholic_drinks_inventory_updated_at
BEFORE UPDATE ON public.alcoholic_drinks_inventory
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Shto disa pije te zakonshme alkoolike
INSERT INTO public.alcoholic_drinks_inventory (drink_name, furnizime, shitje, gjendje, sort_order) VALUES
('Wiski', 0, 0, 0, 1),
('Vodka', 0, 0, 0, 2),
('Amaro', 0, 0, 0, 3),
('Konjak', 0, 0, 0, 4),
('Raki', 0, 0, 0, 5)
ON CONFLICT DO NOTHING;