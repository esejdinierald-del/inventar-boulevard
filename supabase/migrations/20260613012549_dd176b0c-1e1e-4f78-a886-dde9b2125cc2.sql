
-- 1) expense_templates: restrict to authenticated
ALTER POLICY "Authenticated users can view expense_templates" ON public.expense_templates TO authenticated;
ALTER POLICY "Authenticated users can insert expense_templates" ON public.expense_templates TO authenticated;
ALTER POLICY "Authenticated users can update expense_templates" ON public.expense_templates TO authenticated;
ALTER POLICY "Authenticated users can delete expense_templates" ON public.expense_templates TO authenticated;
REVOKE ALL ON public.expense_templates FROM anon;

-- 2) waiter_calls: restrict mutations to authenticated
ALTER POLICY "Authenticated users can update waiter_calls" ON public.waiter_calls TO authenticated;
ALTER POLICY "Authenticated users can delete waiter_calls" ON public.waiter_calls TO authenticated;

-- 3) staff_turn_pins: hide pin column from clients; provide secure RPC
REVOKE SELECT ON public.staff_turn_pins FROM authenticated;
GRANT SELECT (id, staff_name, turn_number, is_active, is_manager, permissions, created_at, updated_at)
  ON public.staff_turn_pins TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_staff_pin(_pin text)
RETURNS TABLE (
  id uuid,
  staff_name text,
  is_manager boolean,
  permissions jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, staff_name, is_manager, permissions
  FROM public.staff_turn_pins
  WHERE pin = _pin AND is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_staff_pin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(text) TO anon, authenticated;

-- 4) search_path on legacy function
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
