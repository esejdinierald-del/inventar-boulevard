import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const ADMIN_PASSWORD = "1983";
const SECRET_PASSWORD = "23061983"; // Fjalëkalim sekret backup
const STAFF_EDIT_WINDOW_MINUTES = 240; // Staff mund të modifikojë të dhënat për 4 orë pas mesnatës (00:00 - 04:00)

export const useAuth = () => {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Kontrollo nëse staff mund të modifikojë të dhënat e ditës së djeshme
  const isWithinStaffEditWindow = useCallback((): boolean => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Nëse jemi brenda STAFF_EDIT_WINDOW_MINUTES minuta pas mesnatës
    return totalMinutes < STAFF_EDIT_WINDOW_MINUTES;
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

  const toggleAdminMode = useCallback(() => {
    if (isAdminUnlocked) {
      setIsAdminUnlocked(false);
      toast.info("Admin u mbyll");
    } else {
      setShowPasswordDialog(true);
    }
  }, [isAdminUnlocked]);

  const closePasswordDialog = useCallback(() => {
    setShowPasswordDialog(false);
  }, []);

  return {
    isAdminUnlocked,
    showPasswordDialog,
    validatePassword,
    toggleAdminMode,
    closePasswordDialog,
    isWithinStaffEditWindow,
  };
};
