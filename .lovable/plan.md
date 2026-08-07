# Kesh Gjendje te Dashboard

## Çfarë kuptoj
Pranë kartës "Xhiro Progresive" shtohet një kartë e re **Kesh Gjendje** që tregon paranë realisht të mbetur për muajin e zgjedhur:

```text
Kesh Gjendje = Σ (xhiro e çdo turni − shpenzimet e atij turni) − shpenzimet e tabelës "expenses" të muajit
```

- Mblidhet turn pas turni (T1 + T2 për çdo ditë), pra progresive brenda muajit.
- Zbriten shpenzimet/anullimet e futura brenda turnit (`turn_data.shpenzime`).
- Zbriten gjithashtu shpenzimet fikse/ditore të regjistruara te faqja Shpenzime (qira, rroga, fatura) për të njëjtin muaj.
- Reset çdo muaj — ndjek selektorin e muajit, njësoj si Xhiro Progresive.

## Shembull
Ditë 1: T1 xhiro 30.000, shpenzime turni 2.000 → 28.000; T2 xhiro 40.000, shpenzime 0 → 40.000
Ditë 2: T1 xhiro 25.000, shpenzime 1.000 → 24.000
Shpenzime nga tabela për muajin: 15.000
Kesh Gjendje = 28.000 + 40.000 + 24.000 − 15.000 = **77.000 ALL**

## Zbatimi teknik
- `src/pages/Dashboard.tsx`:
  - Shtohet fusha `cashBalance` (dhe `totalTurnExpenses`) te `MonthlyData`.
  - Gjatë ciklit ekzistues mbi `entries`, mblidhen `turn1.shpenzime` + `turn2.shpenzime` (`Σ vlera`).
  - `cashBalance = totalXhiro − totalTurnExpenses − totalExpenses` (`totalExpenses` tashmë lexohet nga tabela `expenses`).
  - Shtohet një `StatsCard` i gjashtë me titull "Kesh Gjendje", ikonë `Wallet`, ngjyrë e theksuar nëse negative; grid-i bëhet `lg:grid-cols-6` (ose `lg:grid-cols-3` në dy rreshta për mobil).
  - Shtohet edhe një rresht në CSV export me Kesh Gjendje.
- Asnjë ndryshim në DB, RLS apo logjikën e stokut/diferencave.
