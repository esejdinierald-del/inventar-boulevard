# Plan: Rillogaritje e plot\u00eb e stokut p\u00ebr t\u00eb gjitha datat

## Q\u00ebllimi
Ekzekutoj nj\u00eb rillogaritje t\u00eb vetme (one-time) q\u00eb propagon stokun n\u00eb t\u00eb gjitha datat ekzistuese sipas formul\u00ebs zyrtare, pa ndryshuar asnj\u00eb logjik\u00eb biznesi.

## Formula (e pandryshuar)
- `T2.stokFillim = T1.stokFillim + T1.furnizime - T1.shiriti`
- `Dita+1 T1.stokFillim = T2.stokFillim + T2.furnizime - T2.shiriti`
- `T2.mulliriFillim = T1.mulliriPerfund`
- `Dita+1 T1.mulliriFillim = T2.mulliriPerfund` (ose T1.mulliriPerfund n\u00ebse T2=0)
- N\u00ebse `gjendje_locks` ekziston p\u00ebr (dat\u00eb, turn), respektohet `gjendje` e konfirmuar.

## Hapat

### 1) Forco edge function `recalculate-all-stock` t\u00eb respektoj\u00eb `gjendje_locks`
Versioni aktual p\u00ebrdor vet\u00ebm `stokFillim + furnizime - shiriti` p\u00ebr propagim. Do shtohet leximi i `gjendje_locks` dhe, kur turn-i \u00ebsht\u00eb i konfirmuar, p\u00ebrdoret e nj\u00ebjta logjik\u00eb si `StockPropagationService.calculateStockForNextTurn` (njejt\u00eb si propagimi i klientit). Asgj\u00eb tjet\u00ebr nuk preket.

### 2) Shto buton "Rillogarit gjith\u00e7ka" n\u00eb Dashboard (admin-only)
Te `src/components/Dashboard/AdminSettingsCard.tsx`: nj\u00eb buton i ri q\u00eb th\u00ebrret `supabase.functions.invoke('recalculate-all-stock')`, tregon spinner, dhe shfaq numrin e ndryshimeve. Konfirmim para ekzekutimit.

### 3) Verifikim
Pas ekzekutimit, hap nj\u00eb dat\u00eb t\u00eb hershme dhe nj\u00eb t\u00eb fundit; konfirmo q\u00eb `stokFillim` p\u00ebrputhet me formul\u00ebn dhe `next_day_stock` \u00ebsht\u00eb e p\u00ebrdit\u00ebsuar.

## Garanci sigurie
- Asnj\u00eb ndryshim n\u00eb formul\u00ebn "Dif" apo n\u00eb llogarit\u00ebsit financiar\u00eb.
- T\u00eb dh\u00ebnat hyr\u00ebse (`shiriti`, `furnizime`, `gjendje`, `xhiro`, `shpenzime`) nuk preken \u2014 vet\u00ebm `stokFillim` dhe `mulliriFillim` rillogariten.
- Funksioni mbron me autentifikim admin (tashm\u00eb verifikon JWT; do shtohet `has_role('admin')`).
- Ekziston `daily_entry_history` p\u00ebr rikthim n\u00ebse duhet.

## Fajllat q\u00eb prek
- `supabase/functions/recalculate-all-stock/index.ts` (shton respekt p\u00ebr `gjendje_locks` + check admin)
- `src/components/Dashboard/AdminSettingsCard.tsx` (buton + handler)
