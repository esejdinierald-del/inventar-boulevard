
# Raport teknik për konsultim me Claude

Jam në plan mode, kështu që për të gjeneruar dokumentin e plotë më duhet të kalosh në build mode. Po e përgatis raportin si një skedar të vetëm Markdown që mund ta kopjosh ose ta ngarkosh direkt te Claude.

## Çfarë do të krijoj

Një skedar të vetëm: **`/mnt/documents/raport-per-claude.md`** (≈1500-2000 rreshta, vetëm-lexim për ty, jo prek kodin e projektit).

### Përmbajtja

1. **Konteksti i biznesit** (në shqip + anglisht teknik)
   - Modeli: 2 turne/ditë, struktura `ProductData = {stokFillim, furnizime, gjendje, shiriti}`
   - Formula e Dif: `shiriti + gjendje − stokFillim`
   - Rregulli kritik: furnizime shtohen automatikisht te stokFillim (që Dif të mos numërohet 2 herë)
   - Propagimi: T1 → T2 (e njëjta ditë) → T1 (D+1) përmes `next_day_stock`
   - Mulliri, pijet alkoolike, mapimet e faturave

2. **Problemet që raportove ti** (T2 furnizime, foto mulliri, mapime, propagim)

3. **Bug-et që identifikova** (A–F):
   - A: T2.stokFillim humbiste furnizimet sepse auto-sync 800ms rillogariste vetëm nga T1
   - B: `handleApplySupplies` lexonte `activeTurn` në moment të klikut → faturat shkonin në turnin gabim nëse stafi ndërronte tab pas hapjes së dialogut
   - C: T2.mulliriFillim zerohej kur T1.mulliriPerfund=0
   - D: Mulliri T2 → D+1 vetëm me debounce 1200ms (humbej në print/largim)
   - E: Pijet alkoolike zbriteshin 2 herë (`handleSave` + `handleReceiptData`)
   - F (i hapur): `invoice_mappings` pa kolonë `turn`

4. **Fix-et që zbatova** (tabelë me skedar/ndryshim) + arsyetimi

5. **Pyetjet specifike për Claude**:
   - Edge case-e te formula `(T1.stokFillim − T1.shiriti) + T2.furnizime`
   - Race condition midis 3 useEffect-eve me debounce të ndryshëm te `useTurnData`
   - Siguria e idempotencës me upsert te `alcohol_deductions` nën konkurrencë
   - Risku i `propagateFromDate` pa lock
   - A ia vlen kolona `turn` te `invoice_mappings`

6. **Kodi i plotë i skedarëve kritikë** (që Claude të ketë kontekst të mjaftueshëm pa supozime):
   - `src/types/turn.types.ts`
   - `src/types/mapping.types.ts`
   - `src/services/calculations.ts` + `calculations.test.ts`
   - `src/services/stock-propagation.service.ts`
   - `src/services/alcoholic-drinks.service.ts`
   - `src/hooks/useTurnData.ts` (735 rreshta — qendra e logjikës)
   - `src/hooks/useInvoiceMappings.ts`
   - `src/components/InvoiceMappingManager.tsx`
   - Pjesa rrjedhëse e `src/pages/DailyEntry.tsx` (handleApplySupplies, handleSave, tabat)

## Çfarë NUK do prekë

Asnjë skedar i projektit nuk modifikohet. Vetëm krijohet artifact-i te `/mnt/documents/` që do të shfaqet me një buton "Download" për ta dërguar te Claude.

## Pas miratimit

Kalo në build mode → unë gjeneroj skedarin → ti e shkarkon dhe e ngjit te Claude. Pastaj më kthe sygjerimet e tija dhe diskutojmë cilat ia vlen të zbatohen.
