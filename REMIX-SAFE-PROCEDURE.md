# Procedura: Remix pa humbje të dhënash — inventar-boulevard

> Përgatitur 15 Gusht 2026. Lexo këtë PARA se të shtypësh "Remix" në Lovable për projektin
> `inventar-boulevard` (ID `bac3d1e1-440c-43f7-9533-ede9c835bb34`, Supabase `fesllcwpyfwhgmsjrgcn`).
>
> Vendimi i marrë: remix-i i ri duhet të jetë **KOPJE E PAVARUR** — Supabase i vet, snapshot i
> momentit të remix-it, më pas ndahet nga origjinali (jo bazë e përbashkët).

## Pse humbet diçka pa këtë procedurë

Kur bën "Remix" te Lovable, kopjohet **VETËM KODI** (komponentët React/TS). Supabase-i (baza e
të dhënave) **NUK kopjohet** — Lovable i lidh projektit të ri një Supabase **bosh, krejt të ri**.
Kjo do të thotë humbje e:

1. **Të gjitha të dhënat** — 266 ditë `daily_entries`, historiku, produktet, mapimet, etj.
2. **RLS policy-t "extra"** që u shtuan **direkt në DB** më 15 Gusht 2026 (jo si migrim/skedar
   në kod) — te `coffee_types`, `product_mappings`, `kitchen_products` (INSERT për çdo i
   autentifikuar, jo vetëm admin). Meqë Lovable rindërton skemën e re nga migrimet e projektit
   (jo nga një dump i drejtpërdrejtë i DB-së), **këto rregulla mund të MOS përfshihen automatikisht**
   te remix-i i ri — bug-u i "s'shtoj dot lloj kafeje" / "mapimi nuk ruhet" mund të RIKTHEHET
   atje pa ju vënë re.
3. **Edge functions AI** (`analyze-receipt`, `analyze-invoice`, `analyze-grinder`) dhe çdo
   "secret" (API key) i lidhur me to.
4. **Cilësimet e Auth** (anonymous auth i aktivizuar, `user_roles` me rreshtin admin ekzistues).

## Gjendja e të dhënave (foto e 15 Gusht 2026, referencë)

| Tabelë | Rreshta |
|---|---|
| `daily_entries` | 266 |
| `next_day_stock` | 266 |
| `daily_entry_history` | 52 |
| `alcohol_deductions` | 29 |
| `alcoholic_drinks_inventory` | 26 |
| `product_mappings` | 51 |
| `invoice_mappings` | 40 |
| `products` | 21 |
| `kitchen_products` | 14 |
| `coffee_types` | 8 |
| `expense_templates` | 4 |
| `gjendje_locks` | 3 |
| `staff_turn_pins` | 2 |
| `user_roles` | 1 |
| `expenses`, `shift_turns`, `waiter_calls` | 0 (bosh aktualisht) |

Backup i plotë (JSON) i të gjitha këtyre u eksportua më 15 Gusht 2026 dhe iu dha personit që administron këtë projekt (jashtë Lovable) — kërkoji atij skedarin `FULL_BACKUP_inventar-boulevard_2026-08-15.json` nëse duhet rikthim.

## RLS policy-t "extra" të shtuara direkt në DB më 15 Gusht 2026

Këto **NUK janë** pjesë e ndonjë migrimi në kod — duhen rikrijuar manualisht te Supabase i ri
i remix-it. SQL-i i saktë:

```sql
CREATE POLICY "Authenticated can insert coffee_types"
ON public.coffee_types FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can insert product_mappings"
ON public.product_mappings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can insert kitchen_products"
ON public.kitchen_products FOR INSERT TO authenticated WITH CHECK (true);
```

**Shënim shtesë (jo e rregulluar ende, e panjohur nëse është problem në praktikë):**
`expense_templates` ka të njëjtin gap RLS (INSERT vetëm për admin real). Nëse ndonjëherë provon
të shtosh shpenzim fiks të ri dhe s'punon, është i njëjti shkak.

## Hapat për remix të pavarur, pa humbje (bëji në këtë radhë)

1. **Bëj "Remix"** te Lovable si zakonisht (kjo krijon repo të re + Supabase bosh të ri).
2. **Merr ID-në e re** të projektit dhe të Supabase-it të tij (nga `.env` i repos së re:
   `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`).
3. **Riprodho skemën**: kërko Lovable/Claude të lexojë skemën nga origjinali (`fesllcwpyfwhgmsjrgcn`)
   dhe ta aplikojë 1:1 te Supabase i ri (tabela, tipe, RLS, funksione si `has_role`, trigger-a si
   `cleanup_old_history`). Alternativë më e shpejtë: eksporto skemën me `pg_dump --schema-only`
   nga origjinali (nëse ke qasje) dhe apliko te i riu.
4. **Apliko patjetër** 3 policy-t "extra" të listuara më sipër (s'janë në asnjë migrim).
5. **Importo të dhënat** nga backup-u i fundit (kërko një backup të freskët në momentin e
   remix-it, sepse të dhënat rriten çdo ditë) te Supabase i ri — tabelë për tabelë, në radhën:
   `products`, `coffee_types`, `kitchen_products`, `alcoholic_drinks_inventory`,
   `product_mappings`, `invoice_mappings`, `expense_templates`, `user_roles`, `staff_turn_pins`,
   `daily_entries`, `next_day_stock`, `daily_entry_history`, `alcohol_deductions`, `gjendje_locks`.
6. **Redeploy edge functions**: `analyze-receipt`, `analyze-invoice`, `analyze-grinder` — dhe
   rivendos "secrets" (API key AI) te projekti i ri Supabase (Settings → Edge Functions → Secrets).
7. **Testo**: hyr si Admin te `/daily` në remix, kontrollo që produktet/kafetë/mapimet shfaqen,
   provo Shto lloj kafeje + skanim shiriti (të dyja funksionet e rregulluara sot) për t'u siguruar
   se RLS-të u kopjuan saktë.
8. **RIGJENERO backup-un para çdo remix-i të ri** — foto e 15 Gusht 2026 vjetërsohet; nëse
   remix-i bëhet më vonë, duhen të dhëna të freskëta.

## Kontroll i shpejtë pas remix-it (checklist)

- [ ] Dashboard → Llojet e Kafeve → Shto një test → funksionon (jo gabim heshtjeje)
- [ ] Skano një shirit me artikull të ri → mapo → skano përsëri të njëjtin shirit → s'kërkon rimapim
- [ ] `/daily` → një datë e vjetër (p.sh. 2026-06-01) shfaq të dhënat ekzistuese
- [ ] Raportet (Reports) shfaqin numra korrekt për një muaj të kaluar
