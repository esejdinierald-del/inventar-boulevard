# Përmbledhje e Logjikës së `/daily`

Ky dokument përmbledh të gjithë llogjikën që qëndron pas rrugës `/daily` (Hyrja Ditore e Inventarit). Është menduar si referencë e vetme për konsultë — jo si zëvendësim i kodit.

---

## 1. Përmbajtja në pika të shkurtra

- **Roli**: Faqja kryesore ku stafi/manaxheri/admini plotësojnë çdo ditë inventarin e dy turneve (T1, T2): produkte, kafe, xhiro, shpenzime, mulliri, furnizime.
- **Fluksi tipik i një turni**:
  1. Autentifikim (PIN stafi ose admin password).
  2. Verifikim geofence (staf brenda 50m nga lokali).
  3. Ngarkim/konfirmim i **Gjendjes** fizike → zhbllokon Stok Fillim & Dif.
  4. Plotësim i shitjeve (Shirit + Kafe + Xhiro + Shpenzime).
  5. Ngarkim faturash/receipt (AI parse) → mapim → zbritje automatike.
  6. Printim raporti termik → **kyçja e turnit**.
  7. Propagim automatik i stokut te turni/dita pasardhëse.

---

## 2. Struktura e skedarëve që përbëjnë `/daily`

| Rol | Skedar |
|---|---|
| Faqja / orkestrimi | `src/pages/DailyEntry.tsx` (1082 rreshta) |
| Gjendja e turneve, formulat live, save auto | `src/hooks/useTurnData.ts` |
| Auth admin/staf | `src/hooks/useAuth.ts`, `src/hooks/useStaffSession.ts` |
| Kyçja e turnit pas printit | `src/hooks/useTurnLock.ts` |
| Lista globale e produkteve/kafeve | `src/hooks/useProductList.ts`, `useAlcoholicDrinksList.ts`, `useKitchenProducts.ts` |
| Geofence | `src/hooks/useGeofence.ts`, `src/lib/geofence.ts`, `GeofenceGuard.tsx` |
| Formula matematike | `src/services/calculations.ts` |
| Propagimi i stokut mes turneve/ditëve | `src/services/stock-propagation.service.ts` |
| Storage / DB access | `src/services/storage.service.ts` |
| Zbritje alkooli idempotente | `src/services/alcoholic-drinks.service.ts` |
| Komponentet UI | `DailyEntry/*` (`TurnSection`, `ProductTable`, `CoffeeTable`, `TurnExtras`, `ShpenzimiTable`, `AlcoholicDrinksTable`, `PrintableTurnReport`, `AdminPasswordDialog`, `StaffPinVerifyDialog`, `StaffOnboardingDialog`, `GeofenceGuard`) |
| Skanim AI | `ReceiptScanner.tsx`, `GrinderPhotoScanner.tsx`, `InvoiceMappingManager.tsx` |
| Edge functions AI | `supabase/functions/analyze-receipt`, `analyze-invoice`, `analyze-grinder` |

---

## 3. Autentifikimi dhe rolet

### Admin (password)
- Konstantet: `ADMIN_PASSWORD = "1983"`, `SECRET_PASSWORD = "23061983"` (`useAuth.ts`).
- `isAdminUnlocked` → mund të bëjë gjithçka (edit çdo datë, unlock turne, fshij produkte, rebase stoku, etj.).
- `isViewOnlyUnlocked` → sesion 24-orësh vetëm-lexim (ruhet në localStorage me `viewOnlyExpiry`).

### Staf/Manager (PIN 4-shifror)
- `useStaffSession` mban sesionin (~60 min, shih memory `staff-session-60min`).
- Verifikohet nga RPC `verify_staff_pin(_pin)` te Supabase.
- Manager mund të ketë leje shtesë (`permissions` jsonb → `useManagerPermissions`).
- Pa PIN të verifikuar, T1/T2 janë të bllokuar për input (kërkohet `StaffPinVerifyDialog`).

### Kufizime kohore për stafin
- Staff mund të modifikojë të djeshmen vetëm brenda **240 min pas mesnatës** (`isWithinStaffEditWindow`).
- Për datat e tjera → **read-only** për staf (admin bypass gjithmonë).

---

## 4. Geofence

- Koordinatat e lokalit: `41.1148324, 20.0888188`; rrezja: `VENUE_RADIUS_M = 50`.
- `GeofenceGuard` mbështjell përmbajtjen e `/daily`.
- Nëse GPS jashtë rrezes / mohuar / timeout → dialog bllokues me dy opsione: **Riprovo** ose **Hyr si Admin** (`toggleAdminMode`).
- Admin (`isAdminUnlocked`) e anashkalon plotësisht.

---

## 5. Struktura e të dhënave të turnit

```ts
TurnData = {
  products: { [emri]: { stokFillim, gjendje, shiriti, furnizime } },
  coffee:   { [emri]: number },
  xhiro: number,
  mulliriFillim: number,
  mulliriPerfund: number,
  shpenzime: [{ emertimi, vlera }]
}
```

Çdo ditë ruhet te `public.daily_entries` (kolona `turn1_data`, `turn2_data` jsonb) + tabela ndihmëse `shift_turns` (turne me `is_locked`, `sequence_number`).

---

## 6. Formulat kryesore (`CalculationService`)

### 6.1 Diferenca e produktit (Dif)
```
Dif = shiriti + gjendje − stokFillim
```
- `furnizime` **NUK zbritet** në formulë sepse te `useTurnData` çdo furnizim shtohet menjëherë te `stokFillim` — përndryshe do numërohej dy herë.
- Interpretim:
  - `Dif < 0` → **mungesë** (shitje pa u regjistruar).
  - `Dif > 0` → **tepricë**.
  - `Dif = 0` → përputhet.

### 6.2 Diferenca e mullirit
```
MulliriDif = totalKafe − (mulliriPerfund − mulliriFillim)
```

### 6.3 Propagimi i stokut mes turneve/ditëve
```
StokFillim_pasardhës = StokFillim − Shiriti      // pa gjendje
T1.stokFillim (D)   = T2.stokFillim (D−1) − T2.shiriti (D−1)
```

### 6.4 Formula speciale për T2.stokFillim (ruaj furnizimet e T2)
```
T2.stokFillim = (T1.stokFillim − T1.shiriti) + T2.furnizime
```
Zbatohet te tre pika, gjithmonë njësoj:
1. `useTurnData` — sync gjatë ngarkimit të datës.
2. `useTurnData` — auto-sync T1→T2 (debounce 800ms).
3. `StockPropagationService.updateT2FromT1` — pas ndryshimeve retroaktive.

> Rregull: **mos përdor** `calculateNewStock` ose `calculateStockForNextTurn(t1)` për të ndërtuar T2 — do të fshijë furnizimet e T2.

### 6.5 Mulliri
- Sync end→start: `mulliriPerfund` i T1 → `mulliriFillim` i T2 → `mulliriFillim` i T1 nesër.
- Nëse `T1.mulliriPerfund = 0` **mos** e zero-o `T2.mulliriFillim` (ruaj vlerën ekzistuese).
- `T2.mulliriPerfund` shkon menjëherë te `next_day_stock` përmes `syncMulliriT2ToNextDay` (pa pritur debounce-in 1200ms).

---

## 7. Live sync dhe auto-save (`useTurnData`)

- **Load i datës**: lexon `daily_entries` + `next_day_stock` + migron emrat e vjetër (`PRODUCT_NAME_MIGRATION`) + rikthen dif start dates.
- **Update product**: çdo ndryshim i `furnizime` shton delta te `stokFillim` në të njëjtin turn.
- **Debounce save**:
  - Auto-sync T1→T2 çdo 800ms.
  - Persist në DB çdo 1200ms.
  - `mulliri` sync i T2 është *immediate*.
- **`saveStatus`**: `idle | saving | saved`, shfaqet në UI.
- **History**: `daily_entry_history` mban maksimumi 100 versione për (date, turn) (trigger `cleanup_old_history`).

---

## 8. Gjendja fizike (workflow)

- Për stafin: kolonat **Stok Fillim** dhe **Dif** janë të mjegulluara derisa të shtypet **"Ngarko Gjendjen"** (`onConfirmGjendje`).
- Ruhet në `localStorage: gjendjeUploaded:{date}:{turn}` + tabela `gjendje_locks`.
- Pas printit të turnit: kyçet **10 orë** (`gjendjePrintLockUntil:{date}`) — vetëm admin mund të bëjë unlock.
- Ri-ngarkimi i shiritit **zëvendëson** (jo shton) vlerat.

---

## 9. Kyçja e turnit pas printit

- `useTurnLock` lexon nga tabela `shift_turns` (kolonat `is_locked`, `locked_at`, `staff_name`).
- Kur stafi shtyp **Printo raportin**: `lockTurn(turn, staffName)` → `is_locked = true`.
- Turni i kyçur: të gjitha inputet disabled për stafin. Vetëm **admin** mund të bëjë `unlockTurn`.
- Kyçja është **për datë** — nuk bllokon datat e tjera.

---

## 10. Furnizime (fatura)

- **`InvoiceMappingManager`** hapet nga banner-i i gjendjes për turnin aktual (`targetTurn` = "turn1"/"turn2").
- Hapa:
  1. `InvoiceUploadStep` → foto/PDF → edge function `analyze-invoice` (AI: emra + çmime).
  2. `InvoiceMappingStep` → stafi vendos sasitë (AI nuk vendos sasi).
  3. `invoice_mappings` mapon emrat e faturës në produktet e brendshme.
- Delta shtohet te `stokFillim` i turnit të zgjedhur.
- Negative supplies janë të lejuara (retention).

## 11. Receipt / Shirit (POS)

- `ReceiptScanner` → `analyze-receipt` edge function → `{ productData, coffeeData, alcoholicDrinksData, total }`.
- Rregulla parse: filtro rreshtin `TOTALI`, trajto `:` saktë, ruaj mapping state ndërmjet ngarkimeve.
- Mapping opsional: artikuj pa mapping thjesht **injorohen** (nuk bllokojnë).
- Fraksione të lejuara në `product_mappings.quantity` (p.sh. 0.5).
- **Xhiro** merret nga `total` i receipt-it.
- Dialogu paralajmëron nëse diferenca receipt-shirit është > tolerancë, por lejon stafin të vazhdojë.

## 12. Alkooli (idempotent immediate)

- `applyAlcoholicDrinksImmediately(data, turnNumber)`:
  - Zbret nga `alcoholic_drinks_inventory` **menjëherë** pas ngarkimit të receipt-it.
  - Ruan gjurmën në `alcohol_deductions` me unique key `(entry_date, turn_number, drink_name)`.
  - Ri-ngarkimi llogarit **delta** → **nuk dyfishon**.
- `handleSave` **nuk e thërret** më `AlcoholicDrinksService.applyAlcoholicDrinksSales` (evituar zbritja e dyfishtë).

## 13. Kafe & Mulliri

- Kafeja **NUK** ka inventar bulk — llogaritet vetëm nga mulliri.
- `GrinderPhotoScanner` → `analyze-grinder` edge function → lexon shifrat e mullirit nga foto → mbush `mulliriPerfund`.
- Stafit i lejohet vetëm plotësimi me foto për `mulliriPerfund`.

## 14. Shpenzime

- `shpenzime[]` në secilin turn → zbriten nga xhiro për shitjet neto.
- Tabela `expenses` (jashtë turnit) + `expense_templates` për shpenzime fikse.
- Raportet agregojnë (turn shpenzime + tabela `expenses`).

## 15. Rebase i stokut (admin)

- Butoni **"Rivendos stokun nga gjendja"** te `TurnSection` (vetëm admin).
- `StockPropagationService.rebaseFromGjendje(selectedDate)`:
  - Për çdo produkt: `T2.gjendje` (ose `T1.gjendje` si rezervë) → `stokFillim` i ditës pasardhëse.
  - Rillogarit të gjitha ditët deri sot me formulën standarde.
- Nuk zhbëhet automatikisht.

## 16. Printi (raporti termik)

- `PrintableTurnReport`: format POS 80mm, Courier New.
- Përmban: data/turn/staf, produktet me Dif, kafet + Mulliri Dif, xhiro, shpenzime, totale, alkool.
- Pas printit: `lockTurn` + `gjendjePrintLockUntil` (10h).

---

## 17. Skema e DB e përfshirë

| Tabela | Përdorim te `/daily` |
|---|---|
| `daily_entries` | Ruajtja kryesore e T1/T2 (jsonb). |
| `daily_entry_history` | Snapshots (max 100/turn). |
| `shift_turns` | Kyçja e turnit + sequence. |
| `next_day_stock` | Propagim mulliri T2→T1 nesër. |
| `products` | Lista globale (auto-inherit T1/T2). |
| `coffee_types`, `kitchen_products`, `alcoholic_drinks_inventory` | Lista shtesë. |
| `product_mappings`, `invoice_mappings` | Mapping për receipt/faturë. |
| `alcohol_deductions` | Zbritje idempotente e alkoolit. |
| `gjendje_locks` | Konfirmimi i gjendjes fizike. |
| `expenses`, `expense_templates` | Shpenzime. |
| `staff_turn_pins`, `user_roles` | Auth. |

Të gjitha me RLS të aktivizuar; anon + authenticated kanë policies `USING (true)` sepse aksesi kontrollohet në aplikacion (anon auth + PIN + admin password).

---

## 18. Rreziqe / rregulla që duhen respektuar

1. **Mos ndrysho formulën e Dif-it** pa miratim (rregull ari).
2. **`furnizime` NUK zbritet** te Dif — është tashmë te `stokFillim`.
3. Për T2 gjithmonë përdor `CalculationService.calculateT2StokFillim` (jo `calculateNewStock`).
4. Mos zero-o `T2.mulliriFillim` kur `T1.mulliriPerfund = 0`.
5. `handleSave` nuk duhet të thërrasë më `applyAlcoholicDrinksSales` (evitim dyfishim).
6. Ri-upload i shiritit **zëvendëson**, nuk mbledh.
7. Kyçja e turnit ndikon vetëm datën përkatëse.
8. Kufizimi kohor 240 min pas mesnatës për stafin.
9. Geofence bllokon 100% për staf jashtë rrezes 50m.
10. Nuk lejohen "Xhiro embelsira" ose "Akullore" (të hequra).

---

## 19. Rreshtat kyç për debug të shpejtë

- `useTurnData.ts` → efektet e sync T1↔T2, load, save debounce.
- `calculations.ts` → çdo formulë.
- `stock-propagation.service.ts` → propagim retroaktiv + rebase.
- `DailyEntry.tsx` → orkestrimi i dialogëve, geofence, PIN, printi, kyçjet.
- `useTurnLock.ts` → kyçja e turnit.
- `alcoholic-drinks.service.ts` → idempotenca e alkoolit.

---

*Skedar konsultimi — përditësoje kur ndryshon logjika kryesore.*
