---
name: Geofencing Staff
description: Staff blocked from /daily unless within 50m of venue (41.1148324, 20.0888188). Admin bypasses.
type: feature
---
Staff (including managers) must be physically within VENUE_RADIUS_M (50m) of venue coordinates
to access /daily. Admin (isAdminUnlocked) bypasses entirely. Implemented via:
- src/lib/geofence.ts (haversine + checkVenueProximity)
- src/hooks/useGeofence.ts
- src/components/DailyEntry/GeofenceGuard.tsx wraps /daily content
- Blocked dialog offers "Riprovo" and "Hyr si Admin" (calls toggleAdminMode)
- GPS denied/timeout/unavailable also blocks. Accuracy margin subtracted from distance.
