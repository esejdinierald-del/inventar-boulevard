-- Create table for invoice (purchase) mappings
CREATE TABLE IF NOT EXISTS public.invoice_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_name TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_mappings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is admin-only with password protection)
CREATE POLICY "Allow all operations on invoice_mappings"
ON public.invoice_mappings
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_invoice_mappings_updated_at
BEFORE UPDATE ON public.invoice_mappings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();