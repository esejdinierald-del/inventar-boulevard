-- Add purchase_price column to products table
ALTER TABLE public.products 
ADD COLUMN purchase_price numeric DEFAULT 0;

-- Add purchase_price column to kitchen_products table
ALTER TABLE public.kitchen_products 
ADD COLUMN purchase_price numeric DEFAULT 0;

-- Add purchase_price column to alcoholic_drinks_inventory table
ALTER TABLE public.alcoholic_drinks_inventory 
ADD COLUMN purchase_price numeric DEFAULT 0;

-- Add purchase_price column to coffee_types table
ALTER TABLE public.coffee_types 
ADD COLUMN purchase_price numeric DEFAULT 0;