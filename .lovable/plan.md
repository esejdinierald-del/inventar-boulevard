## Plan: Furnizime shtohet automatikisht te StokFillim

Kur futet/ndryshohet Furnizime për një produkt, vlera shtohet menjëherë te StokFillim i të njëjtit turn. Kolona Furnizime mbetet vetëm si regjistër historie. Formula e Dif përditësohet që të mos numërojë dy herë.

### Ndryshimet kryesore

**1. Formula e re**
- Dif (e re): `Shiriti + Gjendje − StokFillim` (heq `− Furnizime`)
- Stok për turnin/ditën pasardhëse: `Gjendje` (nëse > 0) ose `StokFillim − Shiriti`
- Arsyeja: StokFillim tashmë përfshin Furnizimet.

**2. Sjellja e inputit (useTurnData)**
- Kur thirret `updateTurn1Product(p, 'furnizime', vlera_re)`:
  - `delta = vlera_re − furnizime_aktuale`
  - `stokFillim += delta` (i njëjti turn)
  - `furnizime = vlera_re`
- Njësoj për T2.
- Auto-sync T1→T2: vazhdon të përdorë `calculateStockForNextTurn` (formula e re).

**3. Skedarët që ndryshojnë**
- `src/services/calculations.ts` — `calculateDif`, `calculateNewStock`, `calculateStockForNextTurn` + JSDoc i përditësuar.
- `src/services/calculations.test.ts` — rifresko testet me formula e re.
- `src/hooks/useTurnData.ts` — logjikë e re për `updateTurn{1,2}Product` kur `field === 'furnizime'`.
- `src/components/DailyEntry/ProductTable.tsx` — përditëso llogaritjen e Dif në rresht dhe totale.
- `src/components/DailyEntry/PrintableTurnReport.tsx` — përditëso Dif në print.
- `supabase/functions/fix-t2-stock/index.ts` dhe `recalculate-all-stock/index.ts` — heq `+ furnizime` nga formulat e propagimit.
- `src/services/stock-propagation.service.ts` — njësoj.
- `mem://index.md` Core: ndrysho "Dif Formula" në të renë.

### Çfarë mbetet e njëjtë
- Kolona Furnizime në UI (vetëm-lexim si regjistër, vazhdon të editohet, por tani efekti shkon te StokFillim).
- Skema e DB-së, RLS, auth, print layout, mullir, shpenzime, kafe.
- Të dhënat historike: NUK migrohen automatikisht. Datat e vjetra do të llogariten me formulën e re — për shumicën rezultati është i njëjti sepse StokFillim historik nuk i kishte furnizimet të shtuara. **Kjo është një efekt anësor i rëndësishëm:** datat e mëparshme që kishin Furnizime > 0 do të tregojnë Dif të ndryshme nga më parë.

### Pyetje para implementimit
A duhet të bëj edhe një migrim një-herësh që për të gjitha datat historike: `stokFillim += furnizime, furnizime e mban si është` (që Dif të mbetet 0 për datat e kaluara)? Ose i lëmë datat historike ashtu siç janë dhe formula e re aplikohet vetëm mbi inputet e reja?
