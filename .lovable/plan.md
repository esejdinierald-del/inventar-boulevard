## Qëllimi
Sfumo kolonën **Stok Fillim** në tabelën e produkteve për stafin (jo për admin), që të mos kopjojë vlerën dhe të detyrohet të numërojë fizikisht gjendjen para se të skanojë shiritin.

## Çfarë do ndryshojë

**Vetëm një file:** `src/components/DailyEntry/ProductTable.tsx`

### Sjellja
- **Staff (isAdminUnlocked = false):**
  - Vlera te kolona "Stok Fillim" shfaqet e sfumuar fort (blur + opacity të ulët) që të mos lexohet me sy.
  - Inputi mbetet `disabled` siç është tani (staff nuk e modifikon dot).
  - Po ashtu, vlera totale e "Stok Fillim" te rreshti TOTALI sfumohet, që të mos llogaritet mbledhja mbrapsht.
- **Admin (isAdminUnlocked = true):**
  - Asnjë ndryshim — vlera duket normalisht dhe është e editueshme.

### Stili
- Klasa Tailwind: `blur-sm opacity-40 select-none` mbi inputin dhe mbi qelizën totale, kur `!isAdminUnlocked`.
- Pa hover-reveal, pa toggle — sfumimi mbetet gjithë kohën për stafin (siç u dakorduam: "si fillim vetëm sfumim për staf").

### Çfarë NUK preket
- Llogjika e llogaritjes së `Dif` (mbetet siç është, kështu admin/raporte vazhdojnë normalisht).
- Kolonat e tjera (Gjendje, Shiriti, Furnizime, Dif).
- Propagimi T1→T2→ditë tjetër.
- Skaneri i shiritit dhe mappings.
- Rregullat ekzistuese të bllokimit të datave të kaluara për staf.

## Si do të testohet
1. Hyrje si staf (pa admin) te `/daily/turn1` → kolona "Stok Fillim" duket e turbullt, nuk lexohet.
2. Hap admin me PIN → vlera bëhet menjëherë e qartë dhe e editueshme.
3. Dif vazhdon të llogaritet saktë në sfond.

Nëse provimi shkon mirë me staf, në një hap të dytë mund të diskutojmë nëse ta zgjerojmë (p.sh. fshehje e Shiritit derisa Gjendja të vendoset).
