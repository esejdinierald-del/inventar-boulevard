-- Add category column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'drink';

-- Add check constraint for valid categories
ALTER TABLE public.expenses
ADD CONSTRAINT expenses_category_check 
CHECK (category IN ('kitchen', 'drink'));