# Analizë dhe Plan për T2 / Propagim / Mapime

## Çfarë gjeta (sipas prioritetit tënd)

### 1) Furnizime në T2 — janë **dy** burime bug-u
- `useTurnData.ts:158–163` (load) dhe `:284–306` (auto-sync 800ms): T2.stokFillim rillogaritet pastër nga T1 (`T1.stokFillim − T1.shiriti`), duke **fshirë** furnizimet që janë futur në T2.
- `stock-propagation.service.ts:342–366` (`updateT2FromT1`): e njëjta formulë — propagimi përpara fshin T2.furnizime, dhe pastaj `:110–114` përdor stokun e prishur si farë për ditën pasardhëse.
- `DailyEntry.tsx:691 + 839–845`: dy instanca të `InvoiceMappingManager` (header + brenda T2 tab) ndajnë të njëjtin `handleApplySupplies` që lexon `activeTurn` në çastin e klikimit, jo kur dialogu u hap — nëse përdoruesi ndron tab, fatura shkon në turnin gabim.

### 2) Foto Mulliri në T2
- `useTurnData.ts:298–306`: auto-sync vendos `T2.mulliriFillim = T1.mulliriPerfund` edhe kur T1.mulliriPerfund=0, duke e zeruar T2 sa herë editohet ndonjë gjë në T1.
- Asimetri: T1 ka `syncMulliriT1ToT2` direkt, T2 nuk ka ekuivalent për ditën pasardhëse — del vetëm me debouncen 1200ms. (Butoni "Foto" tashmë u rregullua më parë.)

### 3) Mapime
- `invoice_mappings` s'ka kolonë `turn` → mapimi i ruajtur nga T2 mbishkruan atë të T1.
- `applyAlcoholicDrinksImmediately` (useTurnData.ts:501–547) zbret nga `alcoholic_drinks_inventory` pa ndarje turni, dhe `handleSave` (DailyEntry.tsx:554) thërret edhe `applyAlcoholicDrinksSales` → **zbritje e dyfishtë** kur ngarkohen receta në T1 edhe T2.

### 4) Propagim T1→T2→T1(d+1)
- Pasojë e Bug-it 1: e gjithë zinxhiri humbet furnizimet e T2.
- `useTurnData.ts:98–118` vs `:349`: ngarkimi i mulliri-t të ditës së re mund të mbishkruhet nga auto-save i T2 bosh (race condition).

---

## Plan rregullimi (i kontrolluar, me teste)

### Hapi 1 — Burimi i vetëm i së vërtetës për T2.stokFillim
**Skedarë:** `src/services/calculations.ts`, `src/services/stock-propagation.service.ts`, `src/hooks/useTurnData.ts`

- Shto `CalculationService.calculateT2StokFillim(t1, t2Existing)` që kthen:
  `t1.stokFillim − t1.shiriti + (t2Existing?.furnizime ?? 0)`
- Zëvendëso 3 vendet që përdorin `calculateStockForNextTurn(t1)` për T2:
  - `useTurnData.ts:158–163` (load)
  - `useTurnData.ts:294–296` (live sync)
  - `stock-propagation.service.ts:351` (updateT2FromT1)
- Përditëso `stock-propagation.service.ts:110–114` që `previousStock` për ditën pasardhëse të llogaritet nga `updatedT2.stokFillim + updatedT2.furnizime − updatedT2.shiriti` (nëse stokFillim tashmë e përmban furnizimin, hiqe shtimin — do të zgjedh një konvent të vetëm dhe ta zbatoj kudo).
- Test njësi në `calculations.test.ts` me 4 raste: T2 pa furnizime, T2 me furnizime, T1 me shiriti zero, T2 me gjendje > stok.

### Hapi 2 — Mulliri sync i mbrojtur
**Skedarë:** `src/hooks/useTurnData.ts`

- Në efektin `:298–306`, kushtëzo: `mulliriFillim: turn1.mulliriPerfund > 0 ? turn1.mulliriPerfund : prev.mulliriFillim` (asnjëherë mos e zero-o T2 nga T1 i zbrazët).
- Te ngarkimi i ditës së re (`:98–118`) shto roje: nëse `next_day_stock.mulliri_fillim` është > 0, mos lejo auto-save bosh të T2 ta shkruajë me 0 — kushti `if (newMulliri > 0 || !existingMulliri)`.
- Shto funksion `syncMulliriT2ToNextDay` simetrik me T1, dhe thirre nga `GrinderPhotoScanner` (T2) për të hequr varësinë nga debounce.

### Hapi 3 — Faturat shkojnë në turnin e duhur
**Skedarë:** `src/pages/DailyEntry.tsx`, `src/components/InvoiceMappingManager.tsx`

- Hiq instancën e dyfishtë në header (linja 691) **ose** kalo `targetTurn` prop në secilën `InvoiceMappingManager` (`"turn1" | "turn2"`).
- Ndrysho `handleApplySupplies` të pranojë `targetTurn` si argument të dytë; mos lexo më `activeTurn` brenda.
- Te dialogu, kap `targetTurn` në hapje dhe mos e ndrysho më pas.

### Hapi 4 — Pijet alkoolike pa dy-numërim
**Skedarë:** `src/hooks/useTurnData.ts`, `src/services/alcoholic-drinks.service.ts`, `src/pages/DailyEntry.tsx`

- Bëj `applyAlcoholicDrinksImmediately` idempotent: ruaj `(date, turn) → soldQuantity` te `alcohol_deductions` (kolona ekziston), dhe rillogarit `alcoholic_drinks_inventory.shitje` si SUM për datë (jo `+= delta`).
- Hiq thirrjen e `applyAlcoholicDrinksSales(selectedDate)` nga `handleSave` (DailyEntry.tsx:554) — bëhet e tepërt.
- Test që zbritja totale = T1.shitur + T2.shitur edhe pas re-upload-it të recetës.

### Hapi 5 — Mapime për-turn (opsional, propozoj që në fillim ta lëmë globale)
- Shto kolonë `turn` te `invoice_mappings` dhe `product_mappings` (`null` = aplikon për të dyja).
- UI: switch në InvoiceMapping që zgjedh "Të dyja / vetëm T1 / vetëm T2".
- Pa migrim të dhënash: mapimet ekzistuese mbeten `null` (globale). **Nëse e do, e fus; përndryshe e heq këtë hap.**

### Hapi 6 — Verifikim
- Vitest: të gjitha test-et ekzistuese + të rejat.
- Playwright lokal: skenar real /daily → fut T1 (shiriti+mulliri) → fut T2 furnizime → kontrollo që Dif në T2 dhe stokFillim i ditës pasardhëse përfshijnë furnizimin.
- Test "rebase from gjendje" akoma punon (s'po prek atë rrugë).

---

## Çfarë **nuk** prek
- Formula `Dif = shiriti + gjendje − stokFillim − furnizime` (rregull bazë).
- Llogjika e bllokimit pas printit (10h gjendje).
- PIN-et, rolet, geofence, sesionin 60min.
- Rebase nga gjendja (admin) — e ka rrjedhën e vet të testuar.

## Rendi i ekzekutimit
Hapi 1 → 2 → 3 → 4 → (5 vetëm nëse e konfirmon) → 6.

A të nis me Hapin 1 (më kritiku — rregullon edhe furnizimet edhe propagimin)?
