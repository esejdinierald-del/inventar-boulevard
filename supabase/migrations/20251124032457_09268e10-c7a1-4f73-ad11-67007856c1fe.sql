-- Përditëso product_type për të përfshirë 'alcoholic_drink'
-- Modifiko check constraint për të lejuar 'alcoholic_drink' si vlerë të vlefshme

-- Hiq constraint ekzistues nëse ekziston
ALTER TABLE public.product_mappings 
DROP CONSTRAINT IF EXISTS product_mappings_product_type_check;

-- Shto constraint të ri që lejon 'product', 'coffee', 'kitchen', dhe 'alcoholic_drink'
ALTER TABLE public.product_mappings
ADD CONSTRAINT product_mappings_product_type_check 
CHECK (product_type IN ('product', 'coffee', 'kitchen', 'alcoholic_drink'));