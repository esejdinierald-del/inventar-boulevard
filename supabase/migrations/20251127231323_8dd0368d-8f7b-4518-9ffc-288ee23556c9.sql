-- Create table for staff turn passwords
CREATE TABLE public.staff_turn_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  pin TEXT NOT NULL CHECK (char_length(pin) = 4),
  turn_number INTEGER NOT NULL CHECK (turn_number IN (1, 2)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(staff_name, turn_number)
);

-- Enable RLS
ALTER TABLE public.staff_turn_pins ENABLE ROW LEVEL SECURITY;

-- Allow all operations on staff_turn_pins (since we're using admin password protection)
CREATE POLICY "Allow all operations on staff_turn_pins"
ON public.staff_turn_pins
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE TRIGGER update_staff_turn_pins_updated_at
BEFORE UPDATE ON public.staff_turn_pins
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();