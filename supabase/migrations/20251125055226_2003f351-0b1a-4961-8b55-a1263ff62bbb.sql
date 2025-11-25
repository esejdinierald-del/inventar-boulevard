-- Krijo tabelën për llojet e kafeve
CREATE TABLE public.coffee_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coffee_types ENABLE ROW LEVEL SECURITY;

-- Krijo politikë për aksesim të plotë (siç është për produkte)
CREATE POLICY "Enable all access for coffee_types" 
ON public.coffee_types 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Shto të dhënat fillestare
INSERT INTO public.coffee_types (name, sort_order) VALUES
  ('KAFE', 0),
  ('KORRETO', 1),
  ('LATE', 2),
  ('AMERIKANE', 3),
  ('LECE.LECE', 4),
  ('KAPUCIN KAFE', 5);