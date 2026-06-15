---
name: Admin Rebase Stock From Gjendje
description: Admin-only button "Rivendos stokun nga gjendja" on each TurnSection that re-seeds next-day starting stock from physical count (gjendje) and re-propagates forward via StockPropagationService.rebaseFromGjendje. Default propagation formula (stokFillim − shiriti) is unchanged.
type: feature
---

When admin fixes Dif on a past date, the standard propagation (stokFillim − shiriti) ignores `gjendje`, so subsequent days keep showing discrepancies. The admin-only "Rivendos stokun nga gjendja" button on TurnSection calls `StockPropagationService.rebaseFromGjendje(selectedDate)`:

- Seed per product = T2.gjendje (if >0) else T1.gjendje (if T2 empty) else `stokFillim − shiriti`.
- Writes that as next-day T1.stokFillim and updates `next_day_stock`.
- Forward loop identical to `propagateFromDate` (normal formula).

Confirmation dialog required. Not shown to staff. Mulliri seed follows existing rule (T2.mulliriPerfund || T1.mulliriPerfund).
