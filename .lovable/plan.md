## Kolona e re "Dif fillon" në /daily

Shtoj një kolonë të re menjëherë pas kolonës **Dif** në tabelën e produkteve (T1 dhe T2), që tregon datën kur ka filluar gabimi për secilin produkt — për ta gjetur më lehtë se kush ka bërë input gabim.

### Logjika
- Për secilin produkt, ngarkohet historiku i fundit **30 ditëve** nga `daily_entries`.
- Për çdo ditë llogaritet **Dif total ditor = Dif(T1) + Dif(T2)** me të njëjtën formulë ekzistuese (`shiriti + gjendje − stokFillim`).
- Kërkohet nga sot prapa data më e fundit ku Dif total ditor = **0** (produkti ishte në rregull).
- **"Dif fillon"** = data e parë **pas** asaj dite (d.m.th. dita e parë me Dif ≠ 0 në seri të pandërprerë deri sot).
- Nëse Dif aktual i ditës së zgjedhur = 0 → shfaqet `—`.
- Nëse nuk gjendet asnjë ditë me Dif=0 brenda 30 ditëve → shfaqet `>30 ditë`.

### Ndryshimet teknike

1. **Hook i ri `src/hooks/useDifStartDates.ts`**
   - Input: lista e produkteve + data aktuale.
   - Fetch i vetëm te `daily_entries` për 30 ditët e fundit (të dyja turnet).
   - Llogarit për çdo produkt datën kur "fillon Dif" duke ecur prapa në kohë.
   - Cache në memorie (React Query ose `useMemo` i thjeshtë) për të mos rifreskuar në çdo input.

2. **`src/components/DailyEntry/ProductTable.tsx`**
   - Shton kolonë të re `<TableHead>Dif fillon</TableHead>` menjëherë pas `Dif`.
   - Për çdo rresht shfaq datën formato `dd/MM` (ose `—` / `>30 ditë`).
   - Sfumohet bashkë me Dif kur stafi s'ka konfirmuar Gjendjen.
   - Total row: qelizë bosh për këtë kolonë.
   - Prop i ri: `difStartDates: Record<string, string | null>`.

3. **`src/components/DailyEntry/TurnSection.tsx`** (ose ku thirret `ProductTable`)
   - Thërret `useDifStartDates` dhe pason datat te `ProductTable`.

4. **Print report** — **NUK preket**; kolona shfaqet vetëm në UI.

5. **Testet** — shtohen unit tests në `calculations.test.ts` (ose file i ri) për funksionin që kthen datën e fillimit të Dif.

### Çfarë nuk ndryshon
- Formula e Dif, propagimi i stokut, RLS, skema e DB.
- Sjellja për admin/staf, bllokimi i fushave, printim, raporte.
