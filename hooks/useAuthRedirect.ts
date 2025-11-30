import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to redirect non-authenticated users to signup page
 * @param enabled - Whether the redirect should be enabled (default: true)
 * @param redirectTo - Custom redirect path (default: '/signup')
 */
export const useAuthRedirect = (enabled: boolean = true, redirectTo: string = '/signup') => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled || loading) return;

    if (!user) {
      navigate(redirectTo);
    }
  }, [user, loading, enabled, redirectTo, navigate]);

  return { isAuthenticated: !!user, loading };
};
