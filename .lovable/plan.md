## Çfarë ndryshon

Kur **stafi** shkruan një numër në kolonën **Furnizime** të një produkti, ajo vlerë (delta) i shtohet automatikisht **Stok Fillimit** të të njëjtit turn. Dif rillogaritet sakt menjëherë.

### Shembulli yt (B52, T1)
- Para: stokFillim=10, gjendje=7, shirit=13, furnizime=0 → Dif = 13+7−10 = **10** (mungesë)
- Stafi shkruan furnizime=**10** (10 copë kanë ardhur)
- Pas: stokFillim=**20**, gjendje=7, shirit=13, furnizime=10 → Dif = 13+7−20 = **0** ✅

(Formula aktuale `Dif = shirit + gjendje − stokFillim` tashmë e injoron `furnizime` — shih `CalculationService.calculateDif`. Pra mjafton që sasia të hyjë te stokFillim.)

## Si funksionon teknikisht

**Skedari kryesor: `src/hooks/useTurnData.ts`**

Te funksionet `updateTurn1Product` dhe `updateTurn2Product`, kur `field === 'furnizime'`:
1. Llogarit `delta = newValue − oldFurnizime`
2. Përditëso produktin me: `furnizime = newValue`, `stokFillim = oldStokFillim + delta`
3. Ruaj në DB si zakonisht (debounced save ekzistues).

Për fushat e tjera (`stokFillim`, `gjendje`, `shiriti`) → sjellje pa ndryshim.

### Pse delta dhe jo thjesht +newValue?
Që nëse stafi gabon dhe e korrigjon (p.sh. shkruan 10, pastaj e ndryshon në 8), Stok Fillimi të zbresë me 2, jo të shtohet edhe 8 sipër.

### Aplikimi nga faturat (admin → `handleApplySupplies` në `DailyEntry.tsx`)
Aktualisht thërret `updateTurnXProduct(name, 'furnizime', current + qty)`. Meqë logjika e re e trajton automatikisht këtë rast (delta = qty → stokFillim += qty), **nuk duhet ndryshim shtesë** te `DailyEntry.tsx`. Faturat e adminit do të shtojnë te stokFillim njësoj.

## Pa prekur
- Formula e Dif (mbetet `shirit + gjendje − stokFillim`).
- Pijet alkoolike (inventar global në Dashboard).
- Kafe, kuzhinë, mapimet, RLS, edge functions.
- Propagimi i stokut në turnin/ditën tjetër (përdor `stokFillim`/`gjendje`, që tashmë janë të sakta).
- Historiku ekzistues — vlerat e vjetra mbeten ashtu siç janë ruajtur.

## Konfirmim i shpejtë
A doni që kolona **Furnizime** të mbetet e dukshme me numrin e shkruar (për gjurmim sa furnizim hyri sot), apo të bëhet `0` pasi delta i kalon Stok Fillimit? Rekomandimi im: **mbaje të dukshme** — stafi sheh sa shtoi, dhe printi/historiku ruan gjurmën.
