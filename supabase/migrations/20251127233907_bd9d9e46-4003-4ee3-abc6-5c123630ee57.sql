-- Hiq kufizimin e turnit nga staff_turn_pins
-- Bëj turn_number nullable pasi nuk na nevojitet më
ALTER TABLE public.staff_turn_pins 
ALTER COLUMN turn_number DROP NOT NULL;

-- Hiq çdo unique constraint që përfshin turn_number
-- Së pari kontrollojmë nëse ekziston constraint për staff_name + turn_number
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'staff_turn_pins_staff_name_turn_number_key'
    ) THEN
        ALTER TABLE public.staff_turn_pins 
        DROP CONSTRAINT staff_turn_pins_staff_name_turn_number_key;
    END IF;
END $$;

-- Hiq çdo unique constraint që përfshin pin + turn_number
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'staff_turn_pins_pin_turn_number_key'
    ) THEN
        ALTER TABLE public.staff_turn_pins 
        DROP CONSTRAINT staff_turn_pins_pin_turn_number_key;
    END IF;
END $$;

-- Shto unique constraint vetëm për PIN (çdo staf ka një PIN unik)
ALTER TABLE public.staff_turn_pins 
ADD CONSTRAINT staff_turn_pins_pin_key UNIQUE (pin);

-- Shto unique constraint vetëm për staff_name (çdo staf ka një regjistrim)
ALTER TABLE public.staff_turn_pins 
ADD CONSTRAINT staff_turn_pins_staff_name_key UNIQUE (staff_name);

-- Përditëso të dhënat ekzistuese: vendos turn_number = NULL për të gjithë
UPDATE public.staff_turn_pins SET turn_number = NULL;