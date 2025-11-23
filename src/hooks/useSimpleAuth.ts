import { useState, useEffect } from 'react';
import { AuthService } from '@/services/auth.service';

export const useSimpleAuth = () => {
  const [user, setUser] = useState<{ id: string; username: string; role: 'admin' | 'staff' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = (username: string, password: string) => {
    const loggedInUser = AuthService.login(username, password);
    setUser(loggedInUser);
    return loggedInUser !== null;
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return {
    user,
    loading,
    isAdmin,
    login,
    logout,
    isAuthenticated: user !== null
  };
};
