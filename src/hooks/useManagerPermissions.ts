import { useState, useCallback } from 'react';

export interface ManagerPermissions {
  dashboard: boolean;
  products: boolean;
  expenses: boolean;
  staff: boolean;
}

export interface VerifiedUser {
  name: string;
  isManager: boolean;
  isAdmin: boolean;
  permissions: ManagerPermissions;
}

const DEFAULT_PERMISSIONS: ManagerPermissions = {
  dashboard: false,
  products: false,
  expenses: false,
  staff: false
};

const ADMIN_PERMISSIONS: ManagerPermissions = {
  dashboard: true,
  products: true,
  expenses: true,
  staff: true
};

export const useManagerPermissions = () => {
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);

  const setStaffUser = useCallback((name: string, isManager: boolean, permissions: ManagerPermissions) => {
    setVerifiedUser({
      name,
      isManager,
      isAdmin: false,
      permissions: isManager ? permissions : DEFAULT_PERMISSIONS
    });
  }, []);

  const setAdminUser = useCallback(() => {
    setVerifiedUser({
      name: 'Admin',
      isManager: false,
      isAdmin: true,
      permissions: ADMIN_PERMISSIONS
    });
  }, []);

  const clearUser = useCallback(() => {
    setVerifiedUser(null);
  }, []);

  const hasPermission = useCallback((permission: keyof ManagerPermissions): boolean => {
    if (!verifiedUser) return false;
    if (verifiedUser.isAdmin) return true;
    return verifiedUser.permissions[permission];
  }, [verifiedUser]);

  const canAccessDashboard = useCallback((): boolean => {
    return hasPermission('dashboard');
  }, [hasPermission]);

  const canManageProducts = useCallback((): boolean => {
    return hasPermission('products');
  }, [hasPermission]);

  const canManageExpenses = useCallback((): boolean => {
    return hasPermission('expenses');
  }, [hasPermission]);

  const canManageStaff = useCallback((): boolean => {
    return hasPermission('staff');
  }, [hasPermission]);

  return {
    verifiedUser,
    setStaffUser,
    setAdminUser,
    clearUser,
    hasPermission,
    canAccessDashboard,
    canManageProducts,
    canManageExpenses,
    canManageStaff,
    isAdmin: verifiedUser?.isAdmin || false,
    isManager: verifiedUser?.isManager || false
  };
};
