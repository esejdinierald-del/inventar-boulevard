import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Authentication hook — replaces the legacy hardcoded admin password with
 * real Supabase Auth + `has_role(_user_id, 'admin')` role checks.
 *
 * `validatePassword` and `validateViewOnlyPassword` now take (email, password)
 * and sign in via Supabase. The legacy single-string signatures are no longer
 * supported; callers must pass both arguments.
 */

const STAFF_EDIT_WINDOW_MINUTES = 240; // 4 hours after midnight (00:00 - 04:00)
const VIEW_ONLY_DURATION_MS = 24 * 60 * 60 * 1000;
const VIEW_ONLY_CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Verify the current user has the admin role.
 */
const verifyAdminRole = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });
  if (error) {
    console.error('has_role error:', error);
    return false;
  }
  return data === true;
};

/**
 * Sign in with email/password and confirm admin role. Returns true on success.
 * Signs out automatically if the user is not an admin.
 */
const signInAsAdmin = async (email: string, password: string): Promise<boolean> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    toast.error('Email ose fjalëkalim i pavlefshëm');
    return false;
  }
  const isAdmin = await verifyAdminRole(data.user.id);
  if (!isAdmin) {
    await supabase.auth.signOut();
    toast.error('Kjo llogari nuk ka të drejta admini');
    return false;
  }
  return true;
};

export const useAuth = () => {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [viewOnlyExpiry, setViewOnlyExpiry] = useState<number | null>(() => {
    const saved = localStorage.getItem('viewOnlyExpiry');
    if (saved) {
      const expiry = Number(saved);
      if (expiry > Date.now()) return expiry;
      localStorage.removeItem('viewOnlyExpiry');
    }
    return null;
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showViewOnlyDialog, setShowViewOnlyDialog] = useState(false);

  const isViewOnlyUnlocked = viewOnlyExpiry !== null && viewOnlyExpiry > Date.now();

  // Auto-detect existing admin session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user || user.is_anonymous) return;
      const ok = await verifyAdminRole(user.id);
      if (!cancelled && ok) setIsAdminUnlocked(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Expire view-only sessions
  useEffect(() => {
    if (!viewOnlyExpiry) return;
    const check = () => {
      if (viewOnlyExpiry <= Date.now()) {
        setViewOnlyExpiry(null);
        localStorage.removeItem('viewOnlyExpiry');
        toast.info('⏰ Sesioni i shikimit 24-orësh ka skaduar');
      }
    };
    const interval = setInterval(check, VIEW_ONLY_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [viewOnlyExpiry]);

  const isWithinStaffEditWindow = useCallback((): boolean => {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    return totalMinutes < STAFF_EDIT_WINDOW_MINUTES;
  }, []);

  const isWithinT2Window = useCallback((): boolean => {
    const hours = new Date().getHours();
    return hours >= 17 || hours < 4;
  }, []);

  const validatePassword = useCallback(async (email: string, password: string): Promise<boolean> => {
    const ok = await signInAsAdmin(email, password);
    if (ok) {
      setIsAdminUnlocked(true);
      setShowPasswordDialog(false);
      toast.success('Admin u hap me sukses!');
    }
    return ok;
  }, []);

  const validateViewOnlyPassword = useCallback(async (email: string, password: string): Promise<boolean> => {
    const ok = await signInAsAdmin(email, password);
    if (ok) {
      const expiry = Date.now() + VIEW_ONLY_DURATION_MS;
      setViewOnlyExpiry(expiry);
      localStorage.setItem('viewOnlyExpiry', String(expiry));
      setShowViewOnlyDialog(false);
      toast.success('🔓 Shikimi u zhbllokua për 24 orë!');
    }
    return ok;
  }, []);

  const toggleAdminMode = useCallback(async () => {
    if (isAdminUnlocked) {
      // Logout admin session
      await supabase.auth.signOut();
      setIsAdminUnlocked(false);
      toast.info('Admin u mbyll');
    } else {
      setShowPasswordDialog(true);
    }
  }, [isAdminUnlocked]);

  const requestViewOnly = useCallback(() => setShowViewOnlyDialog(true), []);
  const closePasswordDialog = useCallback(() => setShowPasswordDialog(false), []);
  const closeViewOnlyDialog = useCallback(() => setShowViewOnlyDialog(false), []);
  const unlockAdmin = useCallback(() => setIsAdminUnlocked(true), []);

  return {
    isAdminUnlocked,
    isViewOnlyUnlocked,
    showPasswordDialog,
    showViewOnlyDialog,
    validatePassword,
    validateViewOnlyPassword,
    toggleAdminMode,
    requestViewOnly,
    closePasswordDialog,
    closeViewOnlyDialog,
    isWithinStaffEditWindow,
    isWithinT2Window,
    unlockAdmin,
  };
};
