# Furnizimet e 29/08 T1 që nuk hynë te Stok Fillim

## Çfarë tregojnë të dhënat (e verifikuar)

29/08 T1 ka furnizime të regjistruara, por Stok Fillim është saktësisht sa stoku i trashëguar nga 28/08 — pa furnizimet:

| Produkt | Stok i trashëguar (28→29) | Furnizime T1 | Stok Fillim aktual | Duhej |
|---|---|---|---|---|
| Uje | 106 | 120 | 106 | 226 |
| Heineken shishe | 9 | 48 | 9 | 57 |
| Bustina | 49.5 | 100 | 49.5 | 149.5 |

Pasoja në zinxhir: 29 T2 → 30 → 31 dolën negative (31/08 T1: Uje −43, Heineken −1) sepse mungojnë këto sasi.

E njëjta gjë përsëritet te 30/08 T1 (Uje 120, Heineken 48, Bustina 100 — pa u shtuar te Stok Fillim).

## Çfarë nuk është ende e vërtetuar

Kodi aktual e shton furnizimin te Stok Fillim në të tria rrugët (futja manuale, ngarkimi i datës, propagimi). Prandaj shkaku pse 29/08 doli pa të nuk është konfirmuar. Dyshimet kryesore, që do të verifikohen para çdo ndryshimi kodi:

- turni 1 i 29/08 është i kyçur (`turn1_locked = true`) — korrigjimi automatik i ruajtjes mund të bllokohet nga kyçja, ndaj vlera e gabuar mbetet në bazë;
- furnizimet mund të jenë shkruar nga një rrugë që vendos vlerën direkt (pa delta), p.sh. redaktim mbi turn të kyçur.

## Hapat

### 1. Gjurmim i shkakut
Të identifikohet cila rrugë shkrimi e la Stok Fillim = stok i trashëguar ndërsa furnizimet ishin > 0, veçanërisht sjellja kur turni është i kyçur. Fiksi bëhet mbi shkakun e vërtetuar.

### 2. Forcimi i rojës (guard)
Roja `enforceFurnizimeInStok` të zbatohet edhe kur turni është i kyçur dhe në çdo rrugë shkrimi drejt `daily_entries` (ngarkim, auto-save, propagim), jo vetëm në auto-save-in e turnit të hapur. Kështu rregulli nuk thyhet më nga kyçja.

### 3. Kontroll i dublikatit 29 vs 30
Do të krahasohen faturat/mapimet dhe shitjet reale të dy datave dhe do të raportohet nëse bëhet fjalë për dy dorëzime të vërteta apo për një faturë të futur dy herë. **Nuk bëhet asnjë fshirje pa konfirmimin tënd.**

### 4. Riparim i të dhënave nga 29/08 deri sot
Pas konfirmimit të pikës 3:
- 29/08 T1: Uje 106 → 226, Heineken shishe 9 → 57, Bustina 49.5 → 149.5 (dhe çdo produkt tjetër me të njëjtin simptom).
- Rillogaritje me formulat standarde: 29 T2 → 30 T1/T2 → 31 T1/T2 → 01/09, përfshirë `next_day_stock`.
- Datat para 29/08 nuk preken.

### 5. Test
Test njësi që fikson rastin: turn i kyçur me furnizime → Stok Fillim përfshin gjithmonë furnizimet; ringarkimi dhe propagimi nuk i humbin.

## Detaje teknike

- `src/hooks/useTurnData.ts` — roja të aplikohet pa kusht para upsert-it, jo vetëm kur turni s'është i kyçur.
- `src/services/stock-propagation.service.ts` — i njëjti guard para `update` te `daily_entries`.
- `src/services/calculations.ts` — pa ndryshim formule; vetëm përdorim i njëjtë kudo.
- Riparimi i të dhënave: përditësim i kontrolluar vetëm për datat ≥ 2026-08-29.
- `src/services/calculations.test.ts` — testi i ri.
