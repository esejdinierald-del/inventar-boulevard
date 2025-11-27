-- Change quantity column from integer to numeric to support decimal values (e.g. 0.05 for Tequila)
ALTER TABLE public.product_mappings 
ALTER COLUMN quantity TYPE numeric USING quantity::numeric;

-- Update existing values if any are null
UPDATE public.product_mappings 
SET quantity = 1 
WHERE quantity IS NULL;