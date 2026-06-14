## Plani: Sfumimi rikthehet pas printimit

### Sjellja e re
Pasi stafi shtyp "Printo dhe Kyç" për një turn:
- Turni vazhdon të kyçet (si tani).
- Përveç kyçjes, **`gjendjeUploaded` për atë turn rivendoset në `false`**.
- Rezultati: kolonat **Stok Fillim** dhe **Dif** sfumohen sërish për stafin, ashtu si para konfirmimit fillestar të Gjendjes.
- Kështu, kur stafi i T2 hap aplikacionin (edhe nëse përdor PIN-in e T1 për të parë T1), nuk mund të shohë Stok Fillim / Dif të T1 — sepse sfumimi është aktiv.
- Admin (me fjalëkalim) vazhdon t'i shohë normalisht (sfumimi ndodh vetëm për staf).

### Ndryshim i vetëm në kod
**`src/pages/DailyEntry.tsx` → `handlePrintAndLock`** (rreth rreshtit 494):
Pas `lockTurn(...)`, shto:
```ts
const turnKey = activeTurn; // 'turn1' | 'turn2'
setGjendjeUploaded(prev => {
  const next = { ...prev, [turnKey]: false };
  try { localStorage.setItem(`gjendjeUploaded:${selectedDate}`, JSON.stringify(next)); } catch {}
  return next;
});
```
Pastaj thirret `window.print()` si më parë.

### Çfarë NUK ndryshon
- Logjika e kyçjes së turnit, RLS, kalkulimet, print layout, mulliri, shpenzimet.
- Admini mund përsëri ta riaktivizojë me butonin ekzistues "Unlock Gjendje" nëse duhet korrigjim.
- T1 dhe T2 trajtohen të pavarura — printimi i T1 sfumon vetëm T1; printimi i T2 sfumon T2.

### Pyetje
Para se ta implementoj: kur admini e zhbllokon turnin (`unlockTurn`), a dëshiron që edhe `gjendjeUploaded` të rikthehet automatikisht në `true` (që stafi të shohë sërish menjëherë pas zhbllokimit), apo ta lëmë stafin të rikonfirmojë Gjendjen me butonin "Ngarko Gjendjen"?
