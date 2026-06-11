---
name: Gjendje Confirm Before Shirit
description: Staff must confirm Gjendje (physical count) before scanning Shirit; once confirmed, Gjendje column is locked for staff and only admin can unlock
type: feature
---
Per-turn workflow enforced by `useGjendjeLock` (localStorage keyed by date+turn):

1. Staff fills Gjendje for all products (Stok Fillim stays blurred to force physical counting).
2. Staff clicks "Mbyll Gjendjen & Hap Skanerin" → Gjendje column becomes read-only for staff, ReceiptScanner button enables.
3. Staff uploads receipt → shiriti values REPLACE existing (overwrite).
4. If Dif appears: staff records missing sale in POS, reprints, re-uploads (overwrite again).
5. Only admin/manager can click "Zhblloko Gjendjen" to re-edit Gjendje.

Admin/manager (isAdminUnlocked=true) bypasses the whole gate — scanner always enabled, Gjendje always editable.

Files: `src/hooks/useGjendjeLock.ts`, `src/components/DailyEntry/{TurnSection,ProductTable}.tsx`, `src/components/ReceiptScanner.tsx` (disabled prop), `src/pages/DailyEntry.tsx`.
