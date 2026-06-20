import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import type { AppUser } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = authService.subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Falha ao entrar com o Google.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
    } catch (err: any) {
      setError(err.message || 'Falha ao sair.');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    setError,
    loginWithGoogle,
    logout
  };
};
