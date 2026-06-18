## Problem

The "Foto" button for Mulliri Perfund is disabled for staff in T2 because:

```tsx
// GrinderPhotoScanner.tsx line 96
disabled={currentValue > 0 && !isAdminUnlocked}
```

In T2, `mulliriPerfund` propagates from T1 (via `useTurnData.ts` line 302-303 and `stock-propagation.service.ts`). This means `currentValue > 0` is almost always true for staff, so the photo button stays blocked.

Admin bypasses this because `!isAdminUnlocked` is false.

## Changes

### 1. `src/components/GrinderPhotoScanner.tsx`

**Line 96:** Remove the `currentValue > 0 && !isAdminUnlocked` condition from the "Foto" button `disabled` prop. Staff can always open the photo scanner.

**Dialog content:** When `currentValue > 0`, show a warning below the dialog title:
> "Vlera aktuale: {currentValue} — do të zëvendësohet pas aplikimit"

This warns staff that re-scanning will overwrite the existing propagated value.

### 2. `src/components/DailyEntry/TurnExtras.tsx`

No changes needed. `mulliriPerfundDisabled` (turn locked) already hides the scanner entirely, and manual input remains admin-only.

## Verification

- Staff on /daily, T2: photo button is active even when `mulliriPerfund > 0`; after "Apliko Vlerën", `turn2.mulliriPerfund` updates.
- T2 locked after print: scanner is hidden (no regression).
- T1: no regression.
- Admin: unchanged behavior.