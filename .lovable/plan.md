## Qëllimi

Tri ndryshime për stafin në `/daily/turn1` dhe `/daily/turn2`:

1. **Sfumim i Stok Fillim + Dif** derisa stafi të numërojë Gjendjen dhe të shtypë butonin **"Ngarko Gjendjen"**.
2. **Bllokim total i datave të kaluara** për stafin: pa navigim, pa ngarkim furnizimesh.
3. **Shiriti: zëvendësim, jo mbledhje** — kur stafi ringarkon foton e shiritit, vlera e fundit zëvendëson plotësisht atë të mëparshmen për të gjithë produktet (jo shtim mbi diferencat e mbetura).

---

## Çfarë do ndryshojë

### 1) Sfumim i Stok Fillim & Dif derisa Gjendja të konfirmohet

**Logjikë e re (per turn, per ditë):**
- Shtohet një state lokal `gjendjeUploaded: { turn1: boolean; turn2: boolean }` për ditën aktuale, që ruhet në `localStorage` me çelës `gjendjeUploaded:<date>` (jo në backend, mjafton sesionit/ditës).
- Te `TurnSection` shtohet butoni **"📥 Ngarko Gjendjen"** mbi tabelë.
  - I aktivizuar vetëm kur **çdo produkt ka `gjendje > 0`** (ose së paku të jetë prekur njëherë — preferencë: kërkojmë `gjendje >= 0` të prekur me input, jo zero default; e implementojmë me një `touched` set në ProductTable).
  - Klikimi vendos `gjendjeUploaded[turn]=true` dhe ruan në localStorage.
- Te `ProductTable.tsx`:
  - Kur `!isAdminUnlocked && !gjendjeUploaded` → kolona **Stok Fillim** dhe kolona **Dif** (përfshirë qelizat totale) marrin klasat `blur-sm opacity-40 select-none pointer-events-none`.
  - Pas klikimit "Ngarko Gjendjen" → blur hiqet menjëherë për atë turn.
- Admin (`isAdminUnlocked`) i shikon gjithmonë të qarta.
- Reset: kur ndryshon `selectedDate`, lexohet sërish gjendja nga localStorage; ditë e re = bllokuar deri sa stafi të konfirmojë.

### 2) Stafi nuk lejohet në datat e kaluara

**Te `src/pages/DailyEntry.tsx`:**
- Input-i `<input type="date">` për stafin (kur `!hasElevatedAccess()`) merr atribut `min={today}` dhe `max={today}` → nuk mund të zgjedhë dt të tjera.
- Heqim "view-only unlock" për datat e kaluara nga UI e stafit (mbetet vetëm rruga e plotë "Hyr si Admin").
- Nëse `selectedDate < today` për staf, ridrejto automatikisht në `today` me një `toast.info("Stafi mund të punojë vetëm me datën e sotme")`.
- Hiqet edhe "dritarja 4-orësh pas mesnatës" për ditën e djeshme (sipas kërkesës: zero akses në dt të kaluara).

**Bllokim furnizimesh nga fatura për dt të kaluara:**
- Te `handleApplySupplies` në `DailyEntry.tsx`: në fillim të funksionit, nëse `selectedDate < today && !hasElevatedAccess()` → `toast.error("Nuk mund të ngarkohen furnizime për data të kaluara")` dhe return.
- Po ashtu, butoni "Ngarko Faturën" (`InvoiceMappingManager`) për stafin shfaqet i çaktivizuar kur data nuk është sot.

### 3) Ringarkim i shiritit = zëvendësim i plotë

**Te `useTurnData.ts` — `handleReceiptDataT1` dhe `handleReceiptDataT2`:**
- Aktualisht: `productData[key] !== undefined ? { ...value, shiriti: productData[key] } : value` — produktet që nuk janë në faturën e re ruajnë shiritin e vjetër.
- E re: të gjithë produktet rivendosen — produktet që nuk janë në faturën e re marrin `shiriti: 0`, dhe ata që janë marrin vlerën e re. Kështu "ngarkimi i fundit" është gjithmonë i vetmi i numëruar.
- E njëjta logjikë për kafenë (rivendoset komplet nga `coffeeData`).
- Pijet alkoolike vazhdojnë me zbritjen ekzistuese (s'ka ndryshim aty, sepse ato kalojnë në një tabelë tjetër).

---

## Skedarët që do të preken

- `src/pages/DailyEntry.tsx` — kufizim datash për staf, redirect në `today`, bllokim furnizimesh në dt të kaluara, props të reja për gjendje-confirm.
- `src/components/DailyEntry/TurnSection.tsx` — kalon props `gjendjeUploaded`, `onConfirmGjendje` te `ProductTable`.
- `src/components/DailyEntry/ProductTable.tsx` — butoni "Ngarko Gjendjen", logjika `touched`, blur i kolonave Stok Fillim + Dif.
- `src/hooks/useTurnData.ts` — `handleReceiptDataT1/T2` rivendosin plotësisht `shiriti` dhe `coffee`.
- `src/components/InvoiceMappingManager.tsx` (ose mënyra si thirret te DailyEntry) — disable button për staf në dt jo të sotme.

## Çfarë NUK preket

- Formula e `Dif` dhe propagimi T1→T2→ditë tjetër.
- Llogjika e admin/manager (ata shohin gjithmonë gjithçka pa bllokim).
- Skema e DB-së dhe RLS-të — ndryshim vetëm në frontend.
- Pijet alkoolike dhe zbritja e tyre nga inventari.

## Si do të testohet

1. Si staf, hap `/daily/turn1` për sot: kolonat Stok Fillim & Dif janë të sfumuara. Plotëso Gjendjet → kliko "Ngarko Gjendjen" → kolonat shfaqen të qarta.
2. Si staf provo të zgjedhësh datën e djeshme → input-i nuk e lejon; nëse kalon me URL, ridrejtohet në today me toast.
3. Si staf provo "Ngarko Faturën" me datë të kaluar → bllokohet me toast.
4. Ngarko foto shiriti dy herë me vlera të ndryshme → shiriti përfundimtar = vlera e fundit (jo shumë), për të gjithë produktet.
5. Si admin: çdo gjë mbetet siç është — pa blur, pa bllokim datash, furnizime në çdo datë.
