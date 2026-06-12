import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * useGjendjeLock — Menaxhon konfirmimin e Gjendjes para ngarkimit të Shiritit.
 *
 * KRITIKE: Lock-u ruhet në SERVER (tabela `gjendje_locks`) — jo më vetëm në localStorage.
 * Kështu stafi nuk mund të hapë një pajisje tjetër dhe të ndryshojë gjendjen pasi e ka
 * konfirmuar. Mbahet cache në localStorage për përgjigje optimiste dhe UX të shpejtë.
 *
 * Rrjedha (staf):
 * 1. Staf plotëson Gjendjen për çdo produkt (numërim fizik).
 * 2. Klikon "Mbyll Gjendjen & Hap Skanerin" → upsert në `gjendje_locks`.
 * 3. Vetëm admin/menaxher mund të zhbllokojë (delete nga `gjendje_locks`).
 */
export const useGjendjeLock = (selectedDate: string, turnNumber: 1 | 2) => {
  const storageKey = `gjendje-confirmed-${selectedDate}-T${turnNumber}`;
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [confirmedBy, setConfirmedBy] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Ngarko statusin nga serveri sa herë ndryshon (datë, turn)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      // Optimistic: trego cache-n derisa server-i të kthejë vlerën reale
      try {
        setConfirmed(localStorage.getItem(storageKey) === '1');
      } catch {
        /* ignore */
      }
      try {
        const { data, error } = await supabase
          .from('gjendje_locks')
          .select('confirmed_by')
          .eq('entry_date', selectedDate)
          .eq('turn_number', turnNumber)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.error('gjendje_locks load error:', error);
          return;
        }
        const isConfirmed = !!data;
        setConfirmed(isConfirmed);
        setConfirmedBy(data?.confirmed_by ?? null);
        try {
          if (isConfirmed) localStorage.setItem(storageKey, '1');
          else localStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
      } catch (e) {
        console.error('gjendje_locks fetch failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [storageKey, selectedDate, turnNumber]);

  const confirm = useCallback(
    async (staffName?: string | null) => {
      // Optimistic UI
      setConfirmed(true);
      try {
        localStorage.setItem(storageKey, '1');
      } catch {
        /* ignore quota */
      }
      const { error } = await supabase.from('gjendje_locks').upsert(
        {
          entry_date: selectedDate,
          turn_number: turnNumber,
          confirmed_by: staffName ?? null,
          confirmed_at: new Date().toISOString(),
        },
        { onConflict: 'entry_date,turn_number' }
      );
      if (error) {
        console.error('gjendje_locks confirm error:', error);
        // Rikthe UI nëse server-i refuzon
        setConfirmed(false);
        try {
          localStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
        throw error;
      }
      setConfirmedBy(staffName ?? null);
    },
    [storageKey, selectedDate, turnNumber]
  );

  const unlock = useCallback(async () => {
    setConfirmed(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    const { error } = await supabase
      .from('gjendje_locks')
      .delete()
      .eq('entry_date', selectedDate)
      .eq('turn_number', turnNumber);
    if (error) {
      console.error('gjendje_locks unlock error:', error);
      // Rikthe nëse dështoi heqja
      setConfirmed(true);
      try {
        localStorage.setItem(storageKey, '1');
      } catch {
        /* ignore */
      }
      throw error;
    }
    setConfirmedBy(null);
  }, [storageKey, selectedDate, turnNumber]);

  return { confirmed, confirmedBy, loading, confirm, unlock };
};
