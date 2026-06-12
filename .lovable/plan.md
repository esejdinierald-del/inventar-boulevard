## Qëllimi
1. Sfumim dinamik për "Stok Fillim" + "Dif" sipas gjendjes së Gjendjes/turn lock.
2. Buton "Konfirmo Gjendjen" brenda tabelës, poshtë kolonës Gjendje.
3. Fsheh Xhiron e datave të kaluara nga stafi (vetëm admin/menaxher e sheh).

## 1) Sfumim Stok Fillim + Dif (staf)

Rrjedha:
```text
Hap turnin   → Stok Fillim ░  | Gjendje [ ] | Shiriti — | Dif ░
Konfirmo     → Stok Fillim ✓  | Gjendje 🔒  | Shiriti ✓ | Dif ✓
Kyç turnin   → Stok Fillim ░  | Gjendje 🔒  | Shiriti ✓ | Dif ░
```

### `src/components/DailyEntry/ProductTable.tsx`
- Prop e re `turnLocked: boolean`.
- Flag i vetëm: `obscureForStaff = !isAdminUnlocked && (!gjendjeConfirmed || turnLocked)`.
- Apliko `blur-sm opacity-40 select-none pointer-events-none` te:
  - Inputi "Stok Fillim" për çdo rresht + qeliza TOTALI e saj.
  - Qeliza "Dif" për çdo rresht + qeliza TOTALI e Dif.
- Hiq blur-in aktual gjithmonë-aktiv te Stok Fillim (tani vjen nga `obscureForStaff`).
- Rresht i ri brenda `<TableBody>` poshtë rreshtit TOTALI, vetëm për staf kur `!gjendjeConfirmed && !turnLocked`:
  - `<TableRow>` me `colSpan` të plotë me butonin `✓ Konfirmo Gjendjen`.
  - Validim ekzistues: kërkon të paktën një produkt me `gjendje > 0`.

### `src/components/DailyEntry/TurnSection.tsx`
- I kalon `ProductTable`: `turnLocked={isTurnLocked}` + `onConfirmGjendje`.
- Heq butonin e dyfishtë "Mbyll Gjendjen & Hap Skanerin" nga header (mbetet vetëm brenda tabelës).
- Mban shenjën "🔒 Gjendja e mbyllur" dhe butonin admin "Zhblloko Gjendjen".

## 2) Fshehja e Xhiros për datat e kaluara (staf)

### `src/components/DailyEntry/TurnExtras.tsx`
- Prop e re `hideXhiro?: boolean`.
- Kur `hideXhiro && !isAdminUnlocked`:
  - Inputi i Xhiros zëvendësohet me një placeholder `░░░░ ALL` (ose `blur-sm opacity-40 select-none pointer-events-none` mbi vlerën aktuale + input i mbyllur).
- Asnjë ndryshim te llogaritjet — vetëm prezantim.

### `src/pages/DailyEntry.tsx`
- Llogarit `isPastDate = selectedDate < todayISO` (krahasim string YYYY-MM-DD).
- Kalo `hideXhiro={isPastDate && !isAdminUnlocked}` te të dy `TurnSection` (T1 + T2).
- Përcillet më pas te `TurnExtras` përmes `TurnSection` me prop të ri `hideXhiro`.

### `src/components/DailyEntry/TurnSection.tsx`
- Prop i ri `hideXhiro?: boolean` → kalohet te `TurnExtras`.

Admin/menaxher e sheh Xhiron e çdo date pa kufizim. Data e sotme dhe e djeshme (brenda dritares ekzistuese) mbeten të dukshme për stafin.

## Pa ndryshime në
- `useGjendjeLock.ts`, `useTurnLock.ts`, `calculations.ts`.
- Logjika financiare / propagimi i stokut.
- Skaneri (vazhdon të varet vetëm nga `gjendjeConfirmed`).

## Testim manual
1. Staf, datë e sotme, turn i pa filluar → Stok Fillim + Dif sfumuar; Xhiro e dukshme.
2. Vendos Gjendje + kliko "Konfirmo Gjendjen" → Stok Fillim + Dif të qarta; Gjendja e ngrirë; skaneri i hapur.
3. Mbyll + print "Kyç turnin" → Stok Fillim + Dif sfumohen sërish.
4. Staf zgjedh një datë të kaluar → Xhiro sfumuar/zëvendësuar; Stok Fillim + Dif sfumuar (turni i kyçur).
5. Admin (1983) → gjithçka e dukshme në çdo datë; butoni "Zhblloko Gjendjen" funksionon.
6. `npm test` → testet e CalculationService qëndrojnë jeshile (asnjë ndryshim formule).
