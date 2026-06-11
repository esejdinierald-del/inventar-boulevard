import { useState, useEffect, useCallback } from 'react';

/**
 * useGjendjeLock — Menaxhon konfirmimin e Gjendjes para ngarkimit të Shiritit.
 *
 * Rrjedha e re (staf):
 * 1. Staf plotëson Gjendjen për çdo produkt (numërim fizik).
 * 2. Klikon "Mbyll Gjendjen & Hap Skanerin" → ngrin kolona Gjendje, hapet butoni i shiritit.
 * 3. Pas ngarkimit të shiritit, nëse del Dif, staf rregjistron shitje të re në POS dhe ringarkon
 *    shiritin (vlera shkruhet mbi — zëvendëson totalin).
 * 4. Vetëm admin/menaxher mund të zhbllokojë Gjendjen mbrapsht.
 *
 * Persistuar në localStorage për (datë, turn). Reset-i bëhet automatikisht kur ndryshon data.
 */
export const useGjendjeLock = (selectedDate: string, turnNumber: 1 | 2) => {
  const storageKey = `gjendje-confirmed-${selectedDate}-T${turnNumber}`;
  const [confirmed, setConfirmed] = useState<boolean>(false);

  useEffect(() => {
    try {
      setConfirmed(localStorage.getItem(storageKey) === '1');
    } catch {
      setConfirmed(false);
    }
  }, [storageKey]);

  const confirm = useCallback(() => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // ignore quota errors
    }
    setConfirmed(true);
  }, [storageKey]);

  const unlock = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setConfirmed(false);
  }, [storageKey]);

  return { confirmed, confirm, unlock };
};
