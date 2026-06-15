/**
 * Geofencing utilities for restricting staff access to the venue.
 *
 * Staff must be physically within VENUE_RADIUS_M meters of (VENUE_LAT, VENUE_LNG)
 * to access /daily. Admin bypasses this check entirely.
 */

/** Venue coordinates (Bulevard). */
export const VENUE_LAT = 41.1148324;
export const VENUE_LNG = 20.0888188;

/** Allowed radius in meters. */
export const VENUE_RADIUS_M = 50;

/** Maximum acceptable GPS accuracy in meters before showing a warning. */
export const MAX_ACCEPTABLE_ACCURACY_M = 100;

export type GeofenceFailureReason = 'denied' | 'unavailable' | 'timeout' | 'too_far' | 'unsupported';

export interface GeofenceCheckResult {
  ok: boolean;
  distance?: number;
  accuracy?: number;
  reason?: GeofenceFailureReason;
}

/**
 * Compute great-circle distance between two lat/lng points using the haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface PositionResult {
  lat: number;
  lng: number;
  accuracy: number;
}

/**
 * Get current position with high accuracy. Rejects with a reason string on failure.
 */
function getCurrentPosition(maximumAge: number, timeout: number): Promise<PositionResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject('unsupported' as GeofenceFailureReason);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject('denied' as GeofenceFailureReason);
        else if (err.code === err.TIMEOUT) reject('timeout' as GeofenceFailureReason);
        else reject('unavailable' as GeofenceFailureReason);
      },
      { enableHighAccuracy: true, timeout, maximumAge },
    );
  });
}

/**
 * Check whether the device is within the venue radius.
 * Retries once with fresher GPS if the first reading is too imprecise.
 */
export async function checkVenueProximity(): Promise<GeofenceCheckResult> {
  try {
    let pos = await getCurrentPosition(30_000, 15_000);
    if (pos.accuracy > MAX_ACCEPTABLE_ACCURACY_M) {
      try {
        pos = await getCurrentPosition(0, 15_000);
      } catch {
        // keep the imprecise reading
      }
    }
    const distance = haversineDistance(VENUE_LAT, VENUE_LNG, pos.lat, pos.lng);
    // Allow accuracy margin so users at the edge with imprecise GPS aren't blocked unfairly.
    const effectiveDistance = Math.max(0, distance - pos.accuracy);
    const ok = effectiveDistance <= VENUE_RADIUS_M;
    return {
      ok,
      distance: Math.round(distance),
      accuracy: Math.round(pos.accuracy),
      reason: ok ? undefined : 'too_far',
    };
  } catch (reason) {
    return { ok: false, reason: reason as GeofenceFailureReason };
  }
}
