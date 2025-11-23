import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const ADMIN_PASSWORD = "1983";

export const useAuth = () => {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const validatePassword = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
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
  };
};
