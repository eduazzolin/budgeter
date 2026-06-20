import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import type { AppUser } from '../services/auth';
import { auth, isFirebaseEnabled } from '../firebase';
import { getRedirectResult } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    // Resolve Google redirect login on mobile mount
    if (isFirebaseEnabled() && auth) {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('Google redirect authentication resolved successfully.');
          }
        })
        .catch((err: any) => {
          console.error('Failed to resolve Google redirect credentials:', err);
          setError(err.message || 'Erro ao entrar com o Google.');
        });
    }

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
      // In redirect flows on mobile, this will stay loading until the redirect triggers.
      // On desktop popup, it completes immediately.
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
