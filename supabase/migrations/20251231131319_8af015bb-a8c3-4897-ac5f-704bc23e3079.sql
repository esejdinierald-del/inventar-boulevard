-- Create permissions JSONB column for staff to store manager permissions
-- We'll use the existing staff_turn_pins table and add a permissions column

ALTER TABLE public.staff_turn_pins 
ADD COLUMN is_manager boolean NOT NULL DEFAULT false,
ADD COLUMN permissions jsonb NOT NULL DEFAULT '{"dashboard": false, "products": false, "expenses": false, "staff": false}'::jsonb;