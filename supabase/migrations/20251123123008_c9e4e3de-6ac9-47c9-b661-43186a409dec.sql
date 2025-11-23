-- Fix search_path security issue for cleanup_old_history function
CREATE OR REPLACE FUNCTION public.cleanup_old_history()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.daily_entry_history
  WHERE id IN (
    SELECT id FROM public.daily_entry_history
    WHERE entry_date = NEW.entry_date AND turn_number = NEW.turn_number
    ORDER BY created_at DESC
    OFFSET 100
  );
  RETURN NEW;
END;
$$;