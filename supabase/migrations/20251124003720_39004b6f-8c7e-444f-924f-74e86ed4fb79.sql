-- Krijo tabelën për furnizime/shpenzime
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date DATE NOT NULL,
  product_name TEXT NOT NULL,
  cost NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policy për të gjithë (si për tabelat e tjera)
CREATE POLICY "Enable all access for expenses" 
ON public.expenses 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger për updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();