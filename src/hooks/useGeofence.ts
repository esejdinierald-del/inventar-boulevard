import { useCallback, useEffect, useRef, useState } from 'react';
import { checkVenueProximity, type GeofenceCheckResult } from '@/lib/geofence';

export type GeofenceStatus = 'idle' | 'checking' | 'allowed' | 'blocked';

export interface UseGeofenceState {
  status: GeofenceStatus;
  result: GeofenceCheckResult | null;
  recheck: () => void;
}

/**
 * Runs a geofence check on mount and exposes a recheck() function.
 * `enabled` lets the caller skip checks (e.g. for admin users).
 */
export function useGeofence(enabled: boolean): UseGeofenceState {
  const [status, setStatus] = useState<GeofenceStatus>(enabled ? 'checking' : 'allowed');
  const [result, setResult] = useState<GeofenceCheckResult | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('checking');
    try {
      const r = await checkVenueProximity();
      setResult(r);
      setStatus(r.ok ? 'allowed' : 'blocked');
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus('allowed');
      setResult(null);
      return;
    }
    run();
  }, [enabled, run]);

  return { status, result, recheck: run };
}
