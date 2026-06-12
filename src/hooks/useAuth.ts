import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const ADMIN_PASSWORD = "1983";
const SECRET_PASSWORD = "23061983"; // Fjalëkalim sekret backup
const STAFF_EDIT_WINDOW_MINUTES = 240; // Staff mund të modifikojë të dhënat për 4 orë pas mesnatës (00:00 - 04:00)

const VIEW_ONLY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 orë
const VIEW_ONLY_CHECK_INTERVAL_MS = 60 * 1000; // Kontrollo çdo minutë

export const useAuth = () => {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [viewOnlyExpiry, setViewOnlyExpiry] = useState<number | null>(() => {
    // Kontrollo nëse ka sesion aktiv në localStorage
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

  // Timer për të skaduar automatikisht view-only kur mbaron 24-orëshi
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

  // Kontrollo nëse staff mund të modifikojë të dhënat e ditës së djeshme
  const isWithinStaffEditWindow = useCallback((): boolean => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Nëse jemi brenda STAFF_EDIT_WINDOW_MINUTES minuta pas mesnatës
    return totalMinutes < STAFF_EDIT_WINDOW_MINUTES;
  }, []);

  // Kontrollo nëse jemi brenda orëve të turnit 2 (17:00 - 04:00)
  // Përdoret për të sfumuar Gjendjen e T1 që të mos shihet nga stafi T2
  const isWithinT2Window = useCallback((): boolean => {
    const now = new Date();
    const hours = now.getHours();
    // 17:00 - 23:59 ose 00:00 - 04:00
    return hours >= 17 || hours < 4;
  }, []);

  const validatePassword = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD || password === SECRET_PASSWORD) {
      setIsAdminUnlocked(true);
      setShowPasswordDialog(false);
      toast.success("Admin u hap me sukses!");
      return true;
    } else {
      toast.error("Fjalëkalimi është gabim!");
      return false;
    }
  }, []);

  const validateViewOnlyPassword = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD || password === SECRET_PASSWORD) {
      const expiry = Date.now() + VIEW_ONLY_DURATION_MS;
      setViewOnlyExpiry(expiry);
      localStorage.setItem('viewOnlyExpiry', String(expiry));
      setShowViewOnlyDialog(false);
      toast.success("🔓 Shikimi u zhbllokua për 24 orë!");
      return true;
    } else {
      toast.error("Fjalëkalimi është gabim!");
      return false;
    }
  }, []);

  const toggleAdminMode = useCallback(() => {
    if (isAdminUnlocked) {
      setIsAdminUnlocked(false);
      toast.info("Admin u mbyll");
    } else {
      setShowPasswordDialog(true);
    }
  }, [isAdminUnlocked]);

  const requestViewOnly = useCallback(() => {
    setShowViewOnlyDialog(true);
  }, []);

  const closePasswordDialog = useCallback(() => {
    setShowPasswordDialog(false);
  }, []);

  const closeViewOnlyDialog = useCallback(() => {
    setShowViewOnlyDialog(false);
  }, []);

  const unlockAdmin = useCallback(() => {
    setIsAdminUnlocked(true);
  }, []);

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
    unlockAdmin,
  };
};
