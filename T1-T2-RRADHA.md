# Rradha dhe Logjika T1 → T2 te `/daily` (Regjistrimi Ditor)

Ky file përshkruan **saktësisht** rradhën e veprimeve dhe formulat që lidhin Turnin 1 (T1), Turnin 2 (T2) dhe ditën pasardhëse.

---

## 1. Rradha e veprimeve brenda një turni (staf me PIN)

```
1. PIN i stafit (60 min sesion)        → StaffPinVerifyDialog
2. Dialogu i hapave                    → StaffOnboardingDialog ("OK, kuptova")
3. FAZA A — FURNIZIMET
   - Kolona "Furnizime" e hapur
   - Ngarko faturat (AI: analyze-invoice) → mapim → sasitë i vendos stafi
   - Çdo furnizim shtohet MENJËHERË te StokFillim i TË NJËJTIT turn
   - Butoni "Vazhdo te Gjendja"        → furnizimeConfirmed = true
4. FAZA B — GJENDJA FIZIKE
   - Kolona "Furnizime" BLLOKOHET për stafin
   - Kolona "Gjendje" hapet → numërimi fizik
   - Butoni "Ngarko Gjendjen"          → gjendjeUploaded = true
     (ruhet në daily_entries.gjendje_confirmed + gjendje_locks + localStorage)
5. SHITJET
   - Skanim shiriti POS (analyze-receipt) → shiriti + kafe + xhiro + alkoolike
   - Ri-ngarkimi i shiritit ZËVENDËSON (nuk mbledh)
   - Kafet + Mulliri Fillim/Perfund (foto: analyze-grinder)
   - Shpenzimet e turnit
6. PRINTIMI termik → lockTurn() → turni kyçet (vetëm admin e hap)
7. PROPAGIMI automatik i stokut te turni/dita pasardhëse
```

Admini e anashkalon çdo fazë (A/B), kyçjen dhe geofence-in.

---

## 2. Zinxhiri i stokut: T1 → T2 → T1 (dita pasardhëse)

```
T1 (dita D)                T2 (dita D)                T1 (dita D+1)
stokFillim ────────┐       stokFillim ────────┐       stokFillim
  + furnizime      │         + furnizime      │
  − shiriti  ──────┘         − shiriti  ──────┘
```

### Formulat zyrtare (`src/services/calculations.ts`)

| Nr | Formula | Funksioni |
|----|---------|-----------|
| 1 | `Dif = shiriti + gjendje − stokFillim` | `calculateDif` |
| 2 | `MulliriDif = totalKafe − (mulliriPerfund − mulliriFillim)` | `calculateMulliriDif` |
| 3 | `stok_pasardhës = stokFillim − shiriti` | `calculateStockForNextTurn` |
| 4 | `T2.stokFillim = (T1.stokFillim − T1.shiriti) + T2.furnizime` | `calculateT2StokFillim` |

**Pse furnizimet nuk zbriten te Dif:** çdo furnizim shtohet automatikisht te `stokFillim` i të njëjtit turn (`useTurnData.updateTurn1/2Product`). Nëse do zbritej sërish, do numërohej dy herë.

**Pse T2 ka formulë të veçantë:** çdo sync nga T1 do ta rindërtonte `T2.stokFillim` pastër nga T1 dhe do **fshinte** furnizimet e futura direkt në T2. Prandaj `+ T2.furnizime` është i detyrueshëm.

> Rregull i fortë: **mos përdor kurrë** `calculateNewStock()` ose `calculateStockForNextTurn(t1)` për të ndërtuar T2. Vetëm `calculateT2StokFillim(t1Data, t2Existing)`.

### Dita pasardhëse
```
T1.stokFillim (D+1) = T2.stokFillim (D) − T2.shiriti (D)
```
Ruhet te tabela `next_day_stock` (kolona `stock_data`) dhe lexohet gjatë load-it të datës D+1. Gjendja fizike **nuk** përdoret për propagim — vetëm për Dif.

---

## 3. Ku ekzekutohet sinkronizimi T1 → T2

| Pika | Skedar / vend | Kur |
|------|---------------|-----|
| 1 | `useTurnData` — load i datës (rreshti ~165) | Sa herë ndryshon data |
| 2 | `useTurnData` — auto-sync efekt (rreshti ~303), debounce 800ms | Sa herë ndryshon T1 |
| 3 | `StockPropagationService.updateT2FromT1` | Pas ndryshimeve retroaktive/rebase |

Të treja përdorin **të njëjtën** formulë (nr. 4).

**Përjashtim i rëndësishëm:** `t2ManuallyEditedStokFillim` (Set në `useTurnData`) mban produktet ku admini e ka redaktuar `T2.stokFillim` me dorë — auto-sync-i NUK i mbishkruan ato.

---

## 4. Mulliri (kafeja) — zinxhiri end → start

```
T1.mulliriFillim ─(nga next_day_stock i djeshëm)
T1.mulliriPerfund ──→ T2.mulliriFillim          (syncMulliriT1ToT2, immediate)
T2.mulliriPerfund ──→ next_day_stock.mulliri_fillim (D+1)
                       (syncMulliriT2ToNextDay, debounce 600ms)
```

Rregulla:
- Nëse `T1.mulliriPerfund = 0` → **mos** e zero-o `T2.mulliriFillim` (ruaj vlerën ekzistuese).
- Nëse mulliri i ditës është 0/null gjatë load-it → merret `T2.mulliriPerfund` (ose T1) i ditës së kaluar.
- Foto e mullirit funksionon në të dy turnet; rimarrja e fotos lejohet me paralajmërim.

---

## 5. Furnizimet për turn (kush shkon ku)

- `InvoiceMappingManager` hapet me `targetTurn = "turn1" | "turn2"` nga banner-i i atij turni.
- Delta e sasisë shtohet te `stokFillim` **vetëm** i atij turni.
- Sasitë i vendos stafi (AI nuk vendos sasi); çmimet vijnë nga fatura (çmim njësie).
- Çelësat e mapimit janë `type:name` (shmang përplasjet mes produkteve/kafeve/alkoolike).
- Furnizime negative lejohen dhe ruhen në histori.
- Artikuj pa mapim thjesht injorohen.

---

## 6. Alkoolikët (përjashtim nga propagimi)

Alkooli **nuk** ndjek zinxhirin T1→T2→D+1. Stoku është global (dashboard) dhe zbritet **menjëherë dhe në mënyrë idempotente** në ngarkimin e shiritit (`alcoholic-drinks.service.ts`), me `receipt_id` për të shmangur zbritje të dyfishtë.

Guzhina: produktet e kuzhinës regjistrohen për shitje, por nuk kaskadojnë stok.

---

## 7. Ruajtja, mbrojtjet dhe kyçjet

| Mekanizëm | Detaj |
|---|---|
| Auto-save | debounce 1200ms → `daily_entries` (upsert) |
| Auto-sync T1→T2 | debounce 800ms |
| Mulliri T2 → D+1 | debounce 600ms |
| Double-write guard | `lastManualSaveRef` — shmang mbishkrimin nga efekti pas save-it manual |
| Lock propagimi | lock për-datë me timeout 60s në `StockPropagationService` |
| Mbrojtje 0 | nuk mbishkruhet `next_day_stock` nëse T2 s'ka të dhëna reale |
| Kyçje turni | `shift_turns.is_locked` pas printit; vetëm admin bën unlock |
| Kyçje gjendjeje | 10 orë pas printit (`gjendjePrintLockUntil:{date}`) |
| Histori | `daily_entry_history`, max 100 versione për (datë, turn) |

---

## 8. Rasti "Rivendos stokun nga gjendja" (vetëm admin)

`StockPropagationService.rebaseFromGjendje(date)`:
1. Merr gjendjen fizike të datës D (T2, ose T1 si rezervë).
2. E vendos si `stokFillim` fillestar i ditës D+1.
3. Rillogarit me formulat standarde të gjitha ditët deri sot.
4. Nuk zhbëhet automatikisht.

Përdoret kur Dif-et e vjetra nuk zerohen në ditët pasardhëse.

---

## 9. Përmbledhje në 6 rreshta

1. Furnizimet shtohen te `stokFillim` i turnit ku futen — kurrë dy herë.
2. `Dif = shiriti + gjendje − stokFillim` (negative = mungesë).
3. `T2.stokFillim = (T1.stokFillim − T1.shiriti) + T2.furnizime`.
4. `T1(D+1).stokFillim = T2(D).stokFillim − T2(D).shiriti`.
5. Gjendja fizike shërben vetëm për Dif, jo për propagim (përveç rebase-it admin).
6. Mulliri rrjedh perfund → fillim: T1→T2→dita pasardhëse.
