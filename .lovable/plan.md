## Qëllimi

Zgjidh 4 rreziqet financiare të identifikuara nga auditi:
1. Zbritje e dyfishtë e alkoolit kur ringarkohet shiriti
2. "Konfirmo Gjendjen" vlen vetëm në pajisjen e stafit (mund të anashkalohet)
3. Furnizimet futen edhe në turne të kyçura
4. `gjendje = 0` trajtohet si "nuk u numërua" → infloft stokun e nesërm

## Ndryshime në bazë (migration — i bërë në mesazhin paraardhës)

Dy tabela të reja:

- **`alcohol_deductions`** — Regjistër i sasive të alkoolit të zbritura për (datë, turn, pije). Lejon llogaritjen e delta-s mes ringarkimeve dhe pengon dublimin.
- **`gjendje_locks`** — Konfirmimi i Gjendjes ruhet në server (jo localStorage). Vlen për çdo pajisje.

Të dy: RLS aktive, lexim publik, shkrim nga `authenticated`.

## Ndryshime në kod

### A. `src/hooks/useGjendjeLock.ts` — rishkruhet

- Lexon statusin nga `gjendje_locks` për `(selectedDate, turnNumber)`.
- `confirm(staffName)` → upsert në server, ruan emrin e stafit dhe kohën.
- `unlock()` → fshin rreshtin nga serveri.
- Mban edhe cache në localStorage për përgjigje optimiste (UX).
- Eksporton `confirmedBy` shtesë (kush e ka konfirmuar).

### B. `src/hooks/useTurnData.ts` — idempotence e alkoolit

`applyAlcoholicDrinksImmediately(data, turnNumber)`:

1. Lexo nga `alcohol_deductions` zbritjet e mëparshme për `(selectedDate, turnNumber)`.
2. Për çdo pije në input të ri: `delta = saMeRiu - saIshteAplikuarMëParë`.
3. Përditëso `alcoholic_drinks_inventory` me delta-n (jo me shumën totale).
4. Upsert në `alcohol_deductions` me sasinë e re. Fshi rreshtat që nuk janë më në input.
5. Kjo bën që ringarkimi i të njëjtit shirit të mos zbresë dy herë; një shirit i korrigjuar shton/heq vetëm diferencën.

`handleReceiptDataT1` thërret me `turnNumber=1`, `handleReceiptDataT2` me `turnNumber=2`.

### C. `src/pages/DailyEntry.tsx` — mbrojtja e turneve të kyçura

Në fillim të `handleApplySupplies`:

```ts
const currentTurnNumber = activeTurn === 'turn1' ? 1 : 2;
if (isTurnLocked(currentTurnNumber)) {
  toast.error('Turni është i kyçur. Zhblloko nga admin para se të aplikosh furnizime.');
  return;
}
```

E njëjta mbrojtje për butonin që nis `InvoiceMappingManager` — disable kur turni aktiv është i kyçur.

Përditëso edhe thirrjen `gjendjeT1.confirm(verifiedStaff)` / `gjendjeT2.confirm(verifiedStaff)` për të ruajtur emrin e stafit në server.

### D. `src/services/calculations.ts` — fix gjendje=0

```ts
calculateStockForNextTurn(productData, gjendjeConfirmed = false): number {
  if (gjendjeConfirmed) {
    // Numërimi fizik konfirmuar → beso vlerën edhe nëse është 0
    return Math.max(0, productData.gjendje);
  }
  // Fallback i vjetër (kompatibël prapa)
  if (productData.gjendje > 0) return productData.gjendje;
  if (productData.stokFillim === 0 && productData.furnizime === 0) return 0;
  return productData.stokFillim + productData.furnizime - productData.shiriti;
}
```

### E. Thread `gjendjeConfirmed` te thirrjet

- `useTurnData` pranon prop të reja `gjendjeConfirmedT1`, `gjendjeConfirmedT2`. `DailyEntry` ia kalon nga hook-et `gjendjeT1.confirmed`, `gjendjeT2.confirmed`.
- T1→T2 sync (rreshti 297): kalo `gjendjeConfirmedT1`.
- T2→ditë tjetër (rreshti 339, 449, 611): kalo `gjendjeConfirmedT2`.
- `StockPropagationService.propagateFromDate`: para se të iterojë, lexon `gjendje_locks` për çdo datë në cikël dhe ia kalon `calculateStockForNextTurn`. Default false nëse mungon rresht (sjellja e vjetër).

### F. Testet ekzistuese

`src/services/calculations.test.ts` — shtoj raste:
- `gjendjeConfirmed=true, gjendje=0` → kthen 0 (jo teorik)
- `gjendjeConfirmed=false, gjendje=0, stok=5` → kthen sjelljen e vjetër

## Çfarë NUK ndryshohet

- UI vizuale e faqes mbetet e njëjtë.
- Logjika e Dif (`shiriti+gjendje-stokFillim-furnizime`) e paprekur.
- Asnjë ndryshim te coffee, kitchen, expenses, pin verification.
- Asnjë prekje e tabelave të tjera apo policy-ve ekzistuese.

## Verifikimi

1. Re-ngarko të njëjtin shirit dy herë në T1 → inventari i alkoolit zbret VETËM një herë (i pari).
2. Korrigjo shiritin (ndrysho sasinë e një pije) → diferenca aplikohet, jo shuma e plotë.
3. Konfirmo gjendjen në një pajisje → hap të njëjtën datë në incognito → gjendja shfaqet e kyçur (e ngarkuar nga serveri).
4. Printo & kyç T1 → provo "Ngarko Furnizime" → del toast error, nuk shtohet asgjë.
5. Vendos `gjendje=0` për një produkt, konfirmo gjendjen → ditën tjetër `stokFillim` për atë produkt = 0 (jo teorik).
