import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'staffLoginTs';
export const STAFF_SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes fixed from login

/**
 * Manages a fixed 60-minute staff session (counted from login, not from inactivity).
 * Persists timestamp in localStorage so a page refresh does not reset it.
 *
 * Admin sessions should NOT use this hook — admin has no auto-logout.
 */
export function useStaffSession(onExpire: () => void) {
  const [loginTs, setLoginTs] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const ts = Number(raw);
      if (!Number.isFinite(ts)) return null;
      if (Date.now() - ts >= STAFF_SESSION_DURATION_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return ts;
    } catch {
      return null;
    }
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const endSession = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setLoginTs(null);
  }, []);

  const startSession = useCallback(() => {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      // ignore
    }
    setLoginTs(now);
  }, []);

  // Manage the actual expiry timer.
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (loginTs == null) return;
    const elapsed = Date.now() - loginTs;
    const remaining = STAFF_SESSION_DURATION_MS - elapsed;
    if (remaining <= 0) {
      endSession();
      onExpireRef.current();
      return;
    }
    timerRef.current = setTimeout(() => {
      endSession();
      onExpireRef.current();
    }, remaining);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loginTs, endSession]);

  const isValid = loginTs != null && Date.now() - loginTs < STAFF_SESSION_DURATION_MS;

  return { isValid, startSession, endSession, loginTs };
}
