# Rregulli i 15 Gushtit — furnizimet gjithmonë brenda Stok Fillim

## Si e kuptova kërkesën

Data 15/08 është shembulli i saktë: aty `Stok Fillim = stoku i trashëguar + furnizimet e turnit`, prandaj Dif doli 0 për Uje (216 = 36 + 180), B 52, Heineken, Kanace.

Sot 17/08 kjo nuk ka ndodhur: Uje ka furnizime 264 por Stok Fillim 47 (vetëm stoku i trashëguar) → Dif +264; njësoj Kanace (+24) dhe Crodino (+10). Pasoja shkon më tej: T2 i 17/08 ka Uje me stok **−17** dhe stoku i nesërm (18/08) është ruajtur gjithashtu −17.

Kërkesa jote, siç e kuptoj: rregulli i 15/08 të bëhet i përhershëm dhe i pathyeshëm — për **çdo datë dhe të dy turnet**, duke filluar nga sot 17/08 e në vazhdim (ditët para 17/08 nuk preken). Nëse e kam gabim ndonjë pjesë (p.sh. dëshiron edhe rregullim retroaktiv para 17/08), thuaje para se ta zbatoj.

## Çfarë do bëhet

### 1. Verifikim i shkakut (hapi i parë, para çdo ndryshimi)
Kodi aktual (`useTurnData` në ngarkim, `StockPropagationService.updateT1WithNewStock`, `calculateT2StokFillim`) **tashmë** e shton furnizimin mbi stokun e trashëguar. Prandaj shkaku pse 17/08 doli pa të nuk është ende i vërtetuar. Do të gjurmohet saktësisht cila rrugë e shkroi `stokFillim = 47` me `furnizime = 264` (dyshimet: shkrim me turnin e kyçur pas printimit, ose një ruajtje që anashkalon delta-n). Fiksi bëhet mbi shkakun e vërtetuar, jo mbi hamendje.

### 2. Një burim i vetëm i së vërtetës
Një funksion i vetëm llogaritës që zbaton rregullin:
- T1: `stokFillim = stok i trashëguar (next_day_stock) + T1.furnizime`
- T2: `stokFillim = (T1.stokFillim − T1.shiriti) + T2.furnizime`

Të gjitha rrugët e shkrimit (ngarkim date, auto-sync T1→T2, propagim, aplikim faturash, futje manuale) do ta thërrasin këtë funksion — asnjë vend nuk e llogarit më vetë.

### 3. Rojë (guard) kundër humbjes së furnizimeve
Para çdo ruajtjeje në `daily_entries`, kontroll: nëse një produkt ka `furnizime > 0` por `stokFillim` është saktësisht sa stoku i trashëguar (pra furnizimi mungon), vlera korrigjohet automatikisht dhe shënohet në konsolë. Kështu rregulli mbetet i vlefshëm edhe nëse një rrugë e re shkrimi harron ta zbatojë.

### 4. Riparim i të dhënave nga 17/08 e tutje
- 17/08 T1: Uje 47 → 311, Kanace 298 → 322, Crodino 4 → 14.
- Rillogaritje e T2 të 17/08 nga T1 i korrigjuar (Uje del pozitiv, jo −17).
- Rifreskim i `next_day_stock` për 18/08 e në vazhdim me zinxhirin standard.
- Datat para 17/08 nuk preken.

### 5. Test
Test njësi që fikson rregullin: furnizim i futur → Dif = 0 kur gjendja përputhet; ringarkim faqeje nuk e humbet furnizimin; propagimi T1→T2→ditë pasardhëse nuk e fshin.

## Detaje teknike

- `src/services/calculations.ts` — helper i vetëm `calculateStokFillimWithFurnizime` + ruajtja e `calculateT2StokFillim`.
- `src/hooks/useTurnData.ts` — ngarkimi i datës, auto-sync T1→T2 dhe ruajtja kalojnë përmes helper-it; shtohet guard-i para upsert-it.
- `src/services/stock-propagation.service.ts` — `updateT1WithNewStock` / `updateT2FromT1` përdorin të njëjtin helper.
- `src/pages/DailyEntry.tsx` — aplikimi i faturave mbetet aditiv (`furnizime += sasi`), pa prekur rrugë tjetër.
- Riparimi i të dhënave: një përditësim i kontrolluar vetëm për datat ≥ 2026-08-17.
- `src/services/calculations.test.ts` — testet e reja.
