-- Ndrysho kolonat nga integer në numeric për të pranuar vlera decimale (p.sh. 0.7 litra)
ALTER TABLE public.alcoholic_drinks_inventory 
  ALTER COLUMN furnizime TYPE numeric USING furnizime::numeric,
  ALTER COLUMN shitje TYPE numeric USING shitje::numeric,
  ALTER COLUMN gjendje TYPE numeric USING gjendje::numeric;

-- Vendos default values për kolonat
ALTER TABLE public.alcoholic_drinks_inventory 
  ALTER COLUMN furnizime SET DEFAULT 0,
  ALTER COLUMN shitje SET DEFAULT 0,
  ALTER COLUMN gjendje SET DEFAULT 0;