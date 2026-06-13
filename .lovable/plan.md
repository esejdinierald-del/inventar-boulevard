# Plani i Sigurisë — Statusi

## ✅ Faza A — E PËRFUNDUAR

**Backend:**
- Llogari admin e krijuar: `e.sejdini.erald@gmail.com` (rol `admin`).
- RLS shtrënguar: vetëm `admin` mund të shkruajë te `products`, `coffee_types`, `kitchen_products`, `alcoholic_drinks_inventory`, `product_mappings`, `invoice_mappings`, `expense_templates`, `staff_turn_pins`.
- `staff_turn_pins.pin` nuk lexohet më direkt nga klienti — vetëm RPC `verify_staff_pin`.
- HIBP (leaked password check) i aktivizuar.

**Frontend (fjalëkalimet `"1983"` / `"23061983"` të hequra plotësisht):**
- `useAuth.ts` → `validatePassword(email, password)` përdor Supabase Auth + `has_role`.
- `Dashboard.tsx`, `Reports.tsx`, `Expenses.tsx`, `ManualAdmin.tsx` → forma email+password.
- `StaffPinVerifyDialog.tsx` admin-mode → Supabase Auth.
- `AdminPasswordDialog.tsx` → forma email+password, validimi delegohet te thirrësi.
- `ProductMappingManager.tsx` → Supabase Auth.
- `AdminSettingsCard.tsx` → ndryshim fjalëkalimi përmes `supabase.auth.updateUser`.

## ⏳ Faza B — E SHTYRË

E nevojshme përpara çaktivizimit të anonymous auth:
- Edge function `staff-login` që pas PIN-it kthen një JWT staf të kufizuar.
- Pastaj: çaktivizo `external_anonymous_users_enabled` dhe shtrëngo RLS te `daily_entries`/`expenses` me rol `staff` ose `admin`.
- XSS te `Reports.tsx` print (`escHtml`) — tashmë e bërë në iterimin e mëparshëm.
- RLS te `realtime.messages` për kanalet `waiter:*`.
