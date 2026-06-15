
# Plan: Geofencing për Staf + Auto-Logout 60min

## Qëllimi
1. **Geofencing**: Stafi mund të hapë `/daily` vetëm nëse ndodhet brenda **50m** nga lokali (41.1148324, 20.0888188). Admin pa kufizim.
2. **Auto-logout**: Sesioni i stafit/menaxherit skadon **60min** pas verifikimit të PIN-it (fiks, jo nga inaktiviteti). Admin pa skadencë.

---

## Si do funksionojë (për përdoruesin)

**Stafi:**
1. Hap `/daily` → shfaqet dialog "Po kontrollojmë vendndodhjen…"
2. Telefoni kërkon leje Location (vetëm herën e parë).
3. Nëse:
   - ✅ brenda 50m → vazhdon te dialogu i PIN-it si tani
   - ❌ jashtë 50m → bllokohet me mesazh "Je {X}m larg lokalit. Hyrja lejohet vetëm nga lokali."
   - ❌ refuzon lejen / GPS s'punon → bllokohet me mesazh "GPS i kërkuar. Lejo vendndodhjen ose kontakto adminin."
4. Pas PIN-it të saktë → timer 60min nis. Në minutën 60 → toast "Sesioni skadoi" → kthim te dialogu PIN.

**Admin:**
- Asnjë ndryshim. Pa kontroll GPS, pa auto-logout.
- Në dialogun e bllokimit GPS, ka butonin "Hyr si Admin" (si tek `StaffPinVerifyDialog`) për të anashkaluar gjithçka.

---

## Komponentët e rinj

### 1. `src/lib/geofence.ts` (modul i ri)
- Konstantet:
  ```ts
  export const VENUE_LAT = 41.1148324;
  export const VENUE_LNG = 20.0888188;
  export const VENUE_RADIUS_M = 50;
  ```
- `haversineDistance(lat1, lng1, lat2, lng2): number` — distanca në metra.
- `getCurrentPosition(): Promise<{lat, lng, accuracy}>` — wrapper i `navigator.geolocation.getCurrentPosition` me `enableHighAccuracy: true`, timeout 15s, `maximumAge: 30000`.
- `checkVenueProximity(): Promise<{ok: boolean, distance?: number, reason?: 'denied'|'unavailable'|'timeout'|'too_far'}>`
- Tests në `geofence.test.ts` për haversine (Vitest, kërkesë e standardit).

### 2. `src/hooks/useGeofence.ts`
State machine: `idle | checking | allowed | blocked`, me `reason` dhe `distance`. Eksponon `recheck()`.

### 3. `src/components/DailyEntry/GeofenceGuard.tsx`
Wrapper komponent që:
- Para çdo gjëje tjetër në `/daily`, kontrollon proximity (vetëm nëse `!isAdminUnlocked`).
- `checking` → loader "Po kontrollojmë vendndodhjen…"
- `blocked` → dialog jo i mbyllshëm me:
  - Mesazh sipas `reason`
  - Distancën nëse `too_far` (p.sh. "Je ~85m larg")
  - Butoni "Riprovo" → `recheck()`
  - Butoni "Hyr si Admin" → hap `StaffPinVerifyDialog` në mode admin
- `allowed` → render children (rrjedha normale e `/daily`).

### 4. `src/hooks/useStaffSession.ts`
Menaxhon sesionin e stafit (60min nga login fiks):
- `loginTimestamp: number | null` (në localStorage si `staffLoginTs`).
- Timer `setTimeout` për 60min që pastron PIN/sesionin dhe shkakton ri-shfaqjen e `StaffPinVerifyDialog`.
- `isSessionValid()`, `startSession()`, `endSession()`.
- Mount-on-load: nëse `loginTs` ekziston dhe ka kaluar >60min → endSession menjëherë.

---

## Ndryshime në file ekzistuese

### `src/pages/DailyEntry.tsx`
- Përdor `useStaffSession` për kohëzgjatjen e sesionit (jo veç state lokal).
- Mbështill përmbajtjen kryesore me `<GeofenceGuard>` (vetëm kur staffi nuk është admin).
- Te `handlePinVerified` për staf/menaxher → `session.startSession()`.
- Shto useEffect që dëgjon `session.expired` → reset `staffName/staffData`, hap `StaffPinVerifyDialog`, toast info "Sesioni 60-minutësh skadoi. Fut PIN-in përsëri."

### `src/components/DailyEntry/StaffPinVerifyDialog.tsx`
- Pa ndryshime funksionale; përdoret edhe nga `GeofenceGuard` për anashkalimin admin.

### `index.html`
- Sigurohemi që `<meta name="permissions-policy" content="geolocation=(self)">` (ose kontroll që Vite nuk e bllokon). Nëse mungon, shtohet.

---

## Detaje teknike

**Saktësia e GPS:**
- Pranojmë pozicionin vetëm nëse `accuracy <= 100` (përndryshe riprovojmë 1 herë me `maximumAge: 0`). Nëse pas riprovës ende >100m saktësi, përdorim distancën por shfaqim warning në toast: "GPS i pasaktë (±{accuracy}m)."

**Logging (jo për këtë iteracion):**
- Nuk regjistrojmë në DB. Bllokimi është klient-side; admin mund të anashkalojë lokalisht. Kjo është siguri "operacionale", jo kriptografike (siç u diskutua).

**HTTPS:**
- App-i tashmë në `*.lovable.app` (HTTPS) → `geolocation` punon. PWA i instaluar trashëgon lejen.

**Auto-logout — pse "nga login fiks":**
- Përdor `setTimeout` te `useStaffSession.startSession()` dhe `localStorage` për të mbijetuar refresh.
- Pa event listeners për mousemove/touch → më e thjeshtë dhe më predictable.

---

## Çfarë NUK ndryshon
- Logjika financiare (stock, dif, propagation) — paprekur.
- Admin flow (admin password 1983/23061983 vazhdon pa GPS, pa timer).
- `StaffOnboardingDialog` ekzistues vazhdon të shfaqet pas PIN-it të suksesshëm.

---

## Testim
- Unit tests për `haversineDistance` me pika të njohura.
- Manual QA: pranë lokalit (allowed), larg lokalit (blocked), GPS off (blocked), admin login (anashkalon).

---

## Pyetje e fundit para implementimit
Asnjë — vazhdojmë me këto parametra:
- Koordinatat: 41.1148324, 20.0888188
- Rrezja: 50m
- GPS i refuzuar → blloko
- Auto-logout: 60min fiks nga login
