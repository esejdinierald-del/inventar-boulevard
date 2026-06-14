## Formula e re e propagimit të Stok Fillimit

### Rregulli (i thjeshtë, pa gjendje)

Stok Fillimi i turnit/ditës pasardhëse = **StokFillim − Shirit** i turnit paraardhës.

```
T2.stokFillim (data D) = T1.stokFillim (D) − T1.shiriti (D)
T1.stokFillim (data D) = T2.stokFillim (D−1) − T2.shiriti (D−1)
```

**Gjendje NUK përdoret më** për propagim — shërben vetëm për llogaritjen e Dif (kontrolli fizik), jo për kalimin e stokut.

Furnizimet vazhdojnë të shtohen automatikisht te StokFillim i të njëjtit turn (sjellja ekzistuese), prandaj formula sipër është e mjaftueshme.

### Shembull (kanace, 14/06)
- T1 14/06: stokFillim=216, shirit=6 → **T2 14/06 stokFillim = 216 − 6 = 210** (jo 205, jo 200)
- Nëse T2 14/06: shirit=X → T1 15/06 stokFillim = 210 − X

### Skedarët që preken

1. **`src/services/calculations.ts` — `calculateStockForNextTurn`**
   Hiq degën `if (gjendje > 0) return gjendje`. Bëhet thjesht:
   ```ts
   static calculateStockForNextTurn(p: ProductData): number {
     return p.stokFillim - p.shiriti;
   }
   ```
   (Nëse stokFillim=0 dhe shirit=0 → 0 natyrshëm.)

2. **`src/hooks/useTurnData.ts`** — kudo që llogaritet T2.stokFillim nga T1 ose stoku i ditës tjetër nga T2, përdor formulën e re. Hiq edhe "manual edit lock" për stokFillim të T2 nëse bllokon ri-sinkronizimin (që doli problemi me 200-shin), që T2 të ndjekë gjithmonë T1.stokFillim − T1.shiriti.

3. **`src/services/stock-propagation.service.ts`** — tashmë thërret `calculateStockForNextTurn`, prandaj korrigjohet automatikisht. Komentet/log-et që përmendin "gjendje" duhen përditësuar.

4. **`supabase/functions/recalculate-all-stock/`** dhe **`fix-t2-stock/`** — kontrollo nëse përdorin të njëjtën formulë; nëse po, përditëso në mënyrë identike.

5. **`src/services/calculations.test.ts`** — përditëso testet që mbulojnë rastin `gjendje > 0`.

### Korrigjimi i të dhënave ekzistuese

Pas vendosjes së formulës së re, ekzekuto edge function-in `recalculate-all-stock` (ose `propagateFromDate` nga data më e hershme që duam të rregullojmë, p.sh. 13/06) që historiku të ri-llogaritet me rregullin e ri. Kjo do të korrigjojë T2 14/06 → 210 dhe çdo ditë pasardhëse.

### Çfarë mbetet pa ndryshim

- Formula e Dif: `shirit + gjendje − stokFillim`.
- Furnizime → mbledhen te StokFillim automatikisht.
- Kafe / mulliri, pijet alkoolike, kuzhina, RLS, UI.

### Pyetje konfirmuese
1. Të ekzekutoj `recalculate-all-stock` mbi gjithë historikun pas ndryshimit (rregullon retroaktivisht edhe 14/06)? Po / vetëm nga një datë e caktuar / jo, lëre të zbatohet vetëm për të dhënat e reja.
