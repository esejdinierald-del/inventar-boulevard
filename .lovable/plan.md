## Plan: Print i thjeshtuar për stafin

Kur stafi shtyp "Riprinto", printimi shfaq vetëm thelbësoren. Admini sheh print-in e plotë.

### Ndryshimet

**1. `src/components/DailyEntry/PrintableTurnReport.tsx`**
- Shto prop `isAdminUnlocked: boolean`
- Sekcioni **PRODUKTET**: kur `!isAdminUnlocked`, filtro `products` me `dif !== 0` (vetëm + ose −). Nëse asnjë nuk ka dif, fshih sekcionin.
- Sekcioni **XHIRO**: kur `!isAdminUnlocked`, shfaq vetëm një rresht: `Xhiro - Shpenzime = {xhiroNeto} ALL`. Hiq "Xhiro Bruto" dhe rreshtin e veçantë "Shpenzime".

**2. `src/pages/DailyEntry.tsx`**
- Kalo `isAdminUnlocked={isAdminUnlocked}` te `<PrintableTurnReport>`.

### Çfarë mbetet e njëjtë
- Header, MULLIRI, KAFE, SHPENZIME (lista detajuar), Footer.
- Pamja për admin: print i plotë pa ndryshim.
- Logjika e llogaritjeve, DB, RLS.
