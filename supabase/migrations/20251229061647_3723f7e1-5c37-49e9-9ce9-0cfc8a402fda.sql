-- Create table for fixed expense templates
CREATE TABLE public.expense_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'fixed',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view expense_templates"
ON public.expense_templates FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert expense_templates"
ON public.expense_templates FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update expense_templates"
ON public.expense_templates FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete expense_templates"
ON public.expense_templates FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_expense_templates_updated_at
  BEFORE UPDATE ON public.expense_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();