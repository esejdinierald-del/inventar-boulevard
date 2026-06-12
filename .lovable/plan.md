## Ndryshime

### 1. Navigim nga `/daily` te `/` (Dashboard)
**Problem:** Dialogu `StaffPinVerifyDialog` përdor `onOpenChange={() => {}}` — nuk mund të mbyllet. Kur stafi hyn në `/daily` pa PIN, dialogu mbulon ekranin dhe navigimi (header desktop / bottom-nav mobile) bllokohet.

**Rregullim** në `src/components/DailyEntry/StaffPinVerifyDialog.tsx`:
- Shto buton **"Kthehu te Dashboard"** brenda dialogut që navigon te `/` (përdor `useNavigate`).
- Lër `onOpenChange={() => {}}` (mos lejo mbyllje "rastësore" duke klikuar jashtë), por jep rrugëdalje eksplicite te `/`.

### 2. Print bil minimal
**Skedari:** `src/components/DailyEntry/PrintableTurnReport.tsx`

Ndryshimet:
- **PRODUKTET** — filtro vetëm produktet me `dif !== 0`. Nëse të gjitha janë 0, fsheh të gjithë seksionin PRODUKTET (ose shfaq "Pa diferenca").
- **XHIRO** — gjithmonë tre rreshta, edhe kur `totalShpenzime === 0`:
  ```
  Xhiro Bruto:        X ALL
  − Shpenzime:       −Y ALL
  = TOT:              Z ALL
  ```
  Hiq variantin `xhiro-thermal` (numri i madh).
- **MULLIRI** dhe **KAFE** — të pandryshuara (përdoruesi konfirmoi t'i mbajë jashtë filtrit; vetëm produktet filtrohen).
- **SHPENZIME** — pandryshuar (vetëm shfaqet nëse ka shpenzime).

### 3. Pa ndryshime në logjikën financiare
S'preken: kalkulime stoku, dif, propagim, baza e të dhënave. Vetëm UI dialogu + pamja e printit.

## Test
1. Hap `/daily` në incognito (pa PIN) → shihet dialogu me butonin "Kthehu te Dashboard" → klik → mbërrin te `/`.
2. Mbush një turn ku 2 produkte kanë dif≠0 dhe 10 produkte kanë dif=0 → Printo → bili tregon vetëm 2 produktet.
3. Printo me `shpenzime=0` → blloku XHIRO tregon Xhiro / −0 / =Xhiro në tre rreshta.
