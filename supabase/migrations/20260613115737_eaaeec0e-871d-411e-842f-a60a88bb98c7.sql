-- 1) Krijo llogarinë admin nëse nuk ekziston
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'e.sejdini.erald@gmail.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated', 'authenticated',
      'e.sejdini.erald@gmail.com',
      crypt('erald1983', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(), now(),
      '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', 'e.sejdini.erald@gmail.com', 'email_verified', true),
      'email',
      now(), now(), now()
    );
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 2) Shtrëngo RLS: admin-only writes te tabelat e ndjeshme
-- Helper makro përsëritet poshtë.

-- products
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Admin can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- coffee_types
DROP POLICY IF EXISTS "Authenticated users can insert coffee_types" ON public.coffee_types;
DROP POLICY IF EXISTS "Authenticated users can update coffee_types" ON public.coffee_types;
DROP POLICY IF EXISTS "Authenticated users can delete coffee_types" ON public.coffee_types;
CREATE POLICY "Admin can insert coffee_types" ON public.coffee_types
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update coffee_types" ON public.coffee_types
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete coffee_types" ON public.coffee_types
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- kitchen_products
DROP POLICY IF EXISTS "Authenticated users can insert kitchen_products" ON public.kitchen_products;
DROP POLICY IF EXISTS "Authenticated users can update kitchen_products" ON public.kitchen_products;
DROP POLICY IF EXISTS "Authenticated users can delete kitchen_products" ON public.kitchen_products;
CREATE POLICY "Admin can insert kitchen_products" ON public.kitchen_products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update kitchen_products" ON public.kitchen_products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete kitchen_products" ON public.kitchen_products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- alcoholic_drinks_inventory
DROP POLICY IF EXISTS "Authenticated users can insert alcoholic_drinks_inventory" ON public.alcoholic_drinks_inventory;
DROP POLICY IF EXISTS "Authenticated users can update alcoholic_drinks_inventory" ON public.alcoholic_drinks_inventory;
DROP POLICY IF EXISTS "Authenticated users can delete alcoholic_drinks_inventory" ON public.alcoholic_drinks_inventory;
DROP POLICY IF EXISTS "Authenticated users can view alcoholic_drinks_inventory" ON public.alcoholic_drinks_inventory;
CREATE POLICY "Authenticated can view alcoholic_drinks_inventory" ON public.alcoholic_drinks_inventory
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert alcoholic_drinks_inventory" ON public.alcoholic_drinks_inventory
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- alcohol UPDATE: stafi e ka nevojë për "immediate deduction"
CREATE POLICY "Authenticated can update alcoholic_drinks_inventory" ON public.alcoholic_drinks_inventory
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete alcoholic_drinks_inventory" ON public.alcoholic_drinks_inventory
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- product_mappings (admin-only sipas rregullit ekzistues)
DROP POLICY IF EXISTS "Authenticated users can insert product_mappings" ON public.product_mappings;
DROP POLICY IF EXISTS "Authenticated users can update product_mappings" ON public.product_mappings;
DROP POLICY IF EXISTS "Authenticated users can delete product_mappings" ON public.product_mappings;
CREATE POLICY "Admin can insert product_mappings" ON public.product_mappings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update product_mappings" ON public.product_mappings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete product_mappings" ON public.product_mappings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- invoice_mappings
DROP POLICY IF EXISTS "Authenticated users can insert invoice_mappings" ON public.invoice_mappings;
DROP POLICY IF EXISTS "Authenticated users can update invoice_mappings" ON public.invoice_mappings;
DROP POLICY IF EXISTS "Authenticated users can delete invoice_mappings" ON public.invoice_mappings;
CREATE POLICY "Admin can insert invoice_mappings" ON public.invoice_mappings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update invoice_mappings" ON public.invoice_mappings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete invoice_mappings" ON public.invoice_mappings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- expense_templates (admin-only)
DROP POLICY IF EXISTS "Authenticated users can insert expense_templates" ON public.expense_templates;
DROP POLICY IF EXISTS "Authenticated users can update expense_templates" ON public.expense_templates;
DROP POLICY IF EXISTS "Authenticated users can delete expense_templates" ON public.expense_templates;
DROP POLICY IF EXISTS "Authenticated users can view expense_templates" ON public.expense_templates;
CREATE POLICY "Admin can view expense_templates" ON public.expense_templates
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert expense_templates" ON public.expense_templates
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update expense_templates" ON public.expense_templates
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete expense_templates" ON public.expense_templates
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- staff_turn_pins: vetëm admin lexon/menaxhon. Verifikimi për staf bëhet me RPC.
DROP POLICY IF EXISTS "Allow PIN verification for authenticated users" ON public.staff_turn_pins;
DROP POLICY IF EXISTS "Authenticated users can insert staff_turn_pins" ON public.staff_turn_pins;
DROP POLICY IF EXISTS "Authenticated users can update staff_turn_pins" ON public.staff_turn_pins;
DROP POLICY IF EXISTS "Authenticated users can delete staff_turn_pins" ON public.staff_turn_pins;
CREATE POLICY "Admin can view staff_turn_pins" ON public.staff_turn_pins
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert staff_turn_pins" ON public.staff_turn_pins
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update staff_turn_pins" ON public.staff_turn_pins
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete staff_turn_pins" ON public.staff_turn_pins
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));