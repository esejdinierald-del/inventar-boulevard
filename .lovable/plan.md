## Problemet kryesore të sigurisë (nga skanimi)

### 🔴 Kritike

1. **Fjalëkalimet e adminit në kod** — `"1983"` dhe `"23061983"` janë të hardcoded në bundle. Kushdo që sheh kodin në browser i merr.
2. **Dashboard hapet vetëm me React state** (`isUnlocked`) — mund të anashkalohet me DevTools; të dhënat shkarkohen edhe kur është "i kyçur".
3. **PIN-et e stafit lexohen nga kushdo** — `staff_turn_pins` SELECT lejon çdo sesion anonim → kushdo merr listën e PIN-eve.
4. **`expense_templates` plotësisht i hapur** — anon mund të lexojë rrogat/qiranë dhe t'i fshijë.
5. **Edge functions pa autentikim:**
   - `fix-t2-stock` & `recalculate-all-stock` përdorin service-role pa kontroll → kushdo prish të gjitha të dhënat historike.
   - `analyze-receipt/-invoice/-grinder` pa JWT → çdokush konsumon kreditet AI.
6. **XSS në printin e raporteve** — `document.write` me emra produktesh të paescaped (anon mund të injektojë `<script>` përmes `daily_entries`).

### 🟡 Paralajmërime

7. **Waiter calls** UPDATE/DELETE të hapur për anon.
8. **Realtime channels** pa RLS — kushdo abonohet çdo kanali.
9. **Funksione SECURITY DEFINER** të ekzekutueshme nga anon/authenticated.
10. **search_path** i pavendosur te disa funksione.
11. **Mbrojtje fjalëkalimesh të rrjedhura** (HIBP) e çaktivizuar.

---

## Plani i rregullimit (i ndarë në 4 paketa)

### Paketa 1 — Backend lockdown (më kritike)

- Riparoj politikat RLS të `expense_templates` → vetëm `authenticated`.
- `waiter_calls` UPDATE/DELETE → vetëm `authenticated`.
- `staff_turn_pins`: heq leximin nga `authenticated`; krijoj funksion RPC `verify_staff_pin(_pin text)` `SECURITY DEFINER` që kthen vetëm emrin/permissions kur PIN-i përputhet. Klienti nuk lexon më kolonën `pin`.
- Vendos `search_path = public` te të gjitha funksionet ekzistuese.
- Aktivizoj HIBP për fjalëkalimet.

### Paketa 2 — Edge functions

- Te `fix-t2-stock` dhe `recalculate-all-stock`: shtoj `verify_jwt`, verifikoj që caller është admin (rol `admin` te `user_roles`), përndryshe 401/403.
- Te `analyze-receipt/-invoice/-grinder`: shtoj `verify_jwt = true` dhe kontroll JWT + rate-limit bazë për user.

### Paketa 3 — Admin auth i vërtetë (zëvendëson "1983"/"23061983")

- Krijoj tabelën `app_role` enum + `user_roles` (ekziston tashmë — e përdor).
- Heq plotësisht `ADMIN_PASSWORD`/`SECRET_PASSWORD` nga kodi (`StaffPinVerifyDialog.tsx`, `Dashboard.tsx`, `AdminSettingsCard.tsx`).
- Shtoj llogari admin nëpërmjet Lovable Cloud Auth (email+password). Hyrja e adminit në Dashboard bëhet me login të vërtetë; gate-i klient `isUnlocked` zëvendësohet me kontroll `has_role(auth.uid(),'admin')`.
- Politikat RLS për `daily_entries`, `expenses`, `expense_templates`, `staff_turn_pins`, `products`, `coffee_types`, `alcoholic_drinks_inventory` etj. shtrëngohen sipas rolit.
- Stafi vazhdon të hyjë me PIN (4-shifror) → RPC i ri që kthen sesion staf të kufizuar (vetëm `/daily`, `/waiter`).

### Paketa 4 — XSS dhe Realtime

- Te `Reports.tsx` `handlePrint`, shtoj helper `escHtml()` për të gjitha string-et që vijnë nga DB (emra produkte, etj.).
- Shtoj RLS te `realtime.messages` për të kufizuar topic-at (p.sh. `waiter:*` vetëm për `authenticated`).

---

## Detaje teknike (vetëm referencë)

- Skedarët që preken: `src/components/DailyEntry/StaffPinVerifyDialog.tsx`, `src/pages/Dashboard.tsx`, `src/components/Dashboard/AdminSettingsCard.tsx`, `src/pages/Reports.tsx`, `supabase/functions/*/index.ts`, `supabase/config.toml`, plus migrime SQL.
- Memorja e projektit ka rregullin "Admin (1983 / 23061983)" — pas Paketës 3 e përditësoj në "Admin via login (Cloud Auth) + role"; rregullin "Staff PIN" e mbaj por nëpërmjet RPC, jo SELECT direkt.

---

## Pyetje për ty para se të nis

1. **Renditja:** A i nis të katra paketat me radhë (1 → 4) në një sesion, apo dëshiron t'i bëjmë veçmas (p.sh. fillojmë me Paketa 1+2 sot)?
2. **Admin login:** A dëshiron të kalojmë te login me **email + password** (rekomanduar), apo të mbajmë logjikën aktuale ku adminit i kërkohet vetëm "PIN/fjalëkalim" por të ruajtur si hash në DB (jo si email account)?
3. **Llogaritë admin:** Sa admin do të ketë sistemi? (1 ose disa?)
4. **Anonymous auth:** A jemi dakord ta çaktivizojmë sign-in anonim pas migrimit, që asnjë vizitor i pa-loguar të mos krijojë sesion? (Stafi do të vazhdojë nëpërmjet RPC me PIN.)
