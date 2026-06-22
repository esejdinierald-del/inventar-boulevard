---
name: T2 stokFillim Preserves T2 Furnizime
description: T2.stokFillim formula across load, live sync, and stock propagation. Single source of truth via CalculationService.calculateT2StokFillim that adds T2.furnizime on top of (T1.stokFillim − T1.shiriti). Prevents T1→T2 syncs from wiping T2 invoice supplies.
type: feature
---

**Formula e vetme për T2.stokFillim:**
```
T2.stokFillim = (T1.stokFillim − T1.shiriti) + T2.furnizime
```
Implementuar te `CalculationService.calculateT2StokFillim(t1, t2Existing?)`.

**Vendet ku zbatohet** (mos përdor `calculateNewStock` ose `calculateStockForNextTurn(t1)` për T2):
- `useTurnData.ts` ngarkimi i datës (load sync)
- `useTurnData.ts` efekti i auto-sync T1→T2 (debounce 800ms)
- `stock-propagation.service.ts` `updateT2FromT1` (propagim pas modifikimeve të ditëve të kaluara)

**Mulliri sync** në të njëjtët vende: mos e zero-o `T2.mulliriFillim` kur `T1.mulliriPerfund = 0` — ruaj vlerën ekzistuese.

**T2 mulliriPerfund** kalon menjëherë te next_day_stock via `syncMulliriT2ToNextDay`, pa pritur debounce-in 1200ms.

**Furnizime → turn i duhur**: `InvoiceMappingManager` merr `targetTurn` prop ("turn1"/"turn2") të kapur kur dialogu hapet. Nuk ka më instancë në header.

**Alkool idempotent**: `applyAlcoholicDrinksImmediately(data, turnNumber)` përdor `alcohol_deductions` (upsert/delete me unique key `entry_date,turn_number,drink_name`) dhe llogarit delta — re-upload nuk dyfishon. `handleSave` NUK e thërret më `AlcoholicDrinksService.applyAlcoholicDrinksSales`.
