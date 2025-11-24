-- Create kitchen_products table
CREATE TABLE IF NOT EXISTS public.kitchen_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kitchen_products ENABLE ROW LEVEL SECURITY;

-- Allow all access (same as products table)
CREATE POLICY "Enable all access for kitchen_products"
  ON public.kitchen_products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add some default kitchen products
INSERT INTO public.kitchen_products (name, sort_order) VALUES
  ('Pule', 1),
  ('Mish Vici', 2),
  ('Mish Derri', 3),
  ('Peshk', 4),
  ('Spec', 5),
  ('Domate', 6),
  ('Qepe', 7),
  ('Patate', 8),
  ('Salce', 9),
  ('Vaj', 10)
ON CONFLICT (name) DO NOTHING;