---
name: Staff Session 60min
description: Staff/manager PIN session expires 60min after login (fixed, not idle). Admin no expiry.
type: feature
---
useStaffSession hook in src/hooks/useStaffSession.ts:
- 60min from login timestamp (stored in localStorage `staffLoginTs`)
- Survives page refresh
- On expire: clears verifiedStaff, reopens StaffPinVerifyDialog, shows toast
- Admin login does NOT call startSession → no auto-logout for admin
- Fixed-from-login (not idle reset) per user choice for predictability
