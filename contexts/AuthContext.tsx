import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { Profile } from '../types';

type AuthMode = 'login' | 'signup';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean; // Session loading state
  profileLoading: boolean; // Profile data loading state
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  openModal: (mode: AuthMode) => void;
  closeModal: () => void;
  setAuthMode: (mode: AuthMode) => void;
  refetchProfile: () => Promise<void>;
  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, userData: { full_name: string }) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithLinkedIn: () => Promise<{ error: any }>;
  sendMagicLink: (email: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Tracks session loading
  const [profileLoading, setProfileLoading] = useState(true); // Start as true, will be set to false once we know if there's a user or not
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');

  // Effect for handling session state
  useEffect(() => {
    const getSessionData = async () => {
      console.log('[AuthContext] Fetching initial session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthContext] Initial session:', session ? 'exists' : 'null');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Session loading is complete

      // If no session, no need to wait for profile
      if (!session) {
        console.log('[AuthContext] No session, setting profileLoading to false');
        setProfileLoading(false);
      }
    };

    getSessionData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Completely ignore token refresh events - don't even log them
      if (event === 'TOKEN_REFRESHED') {
        // Do absolutely nothing - no state updates, no logging
        // This prevents page refreshes when switching tabs
        return;
      }

      // Log other important events
      console.log('[AuthContext] Auth state change:', event, session ? 'with session' : 'no session');

      // Handle signed out state
      if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out, clearing session');
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Handle signed in and initial session
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        console.log('[AuthContext] Setting session:', session ? 'valid session' : 'no session');
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          setIsAuthModalOpen(false);
        }
        setLoading(false);
        return;
      }

      // Fallback: ensure loading is always set to false for any unhandled events
      console.log('[AuthContext] Unhandled auth event, setting loading to false');
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Effect for fetching profile data when user changes
  const fetchProfile = useCallback(async () => {
    if (user) {
      console.log('[AuthContext] 🔍 Fetching profile for user:', user.id);
      setProfileLoading(true);
      try {
        // Primero intentar obtener el perfil
        console.log('[AuthContext] 📡 Querying profiles table...');
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .limit(1)
          .single();

        console.log('[AuthContext] 📊 Query result:', { 
          hasData: !!data, 
          errorCode: error?.code, 
          errorMessage: error?.message 
        });

        // If profile doesn't exist (e.g., user signed up before trigger was in place), create one.
        if (error && error.code === 'PGRST116') {
          console.warn('[AuthContext] ⚠️ Profile not found for user, creating a new one.');
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email,
              slug: user.id, // Default slug to user ID to ensure it's unique
            })
            .select()
            .single();

          if (insertError) {
            console.error('[AuthContext] ❌ Error creating profile:', insertError);
            throw insertError;
          }
          console.log('[AuthContext] ✅ Profile created successfully');
          data = newProfile;
        } else if (error) {
          // For any other errors, re-throw to be caught by the catch block
          console.error('[AuthContext] ❌ Error fetching profile:', error);
          throw error;
        }

        console.log('[AuthContext] ✅ Profile loaded:', data ? `id=${data.id}, name=${data.full_name}, role=${data.role}` : 'null');
        setProfile(data as Profile | null);
      } catch (error: any) {
        console.error("[AuthContext] ❌ Error fetching or creating profile:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint
        });
        setProfile(null); // Set profile to null if any error occurs
      } finally {
        console.log('[AuthContext] ✅ Profile loading complete');
        setProfileLoading(false);
      }
    } else {
      // If there is no user, there is no profile.
      console.log('[AuthContext] ℹ️ No user, clearing profile');
      setProfile(null);
      setProfileLoading(false);
    }
  }, [user]);

  // Only fetch profile when user ID actually changes, not on every user object change
  const userIdRef = useRef<string | null>(null);
  const hasFetchedProfile = useRef<boolean>(false);

  useEffect(() => {
    const currentUserId = user?.id || null;
    console.log('[AuthContext] User ID effect triggered, current:', currentUserId, 'previous:', userIdRef.current, 'hasFetched:', hasFetchedProfile.current);

    // Fetch profile if:
    // 1. User ID changed, OR
    // 2. We have a user but haven't fetched the profile yet (happens on page reload)
    const shouldFetch = currentUserId !== userIdRef.current || (currentUserId && !hasFetchedProfile.current);

    if (shouldFetch && currentUserId) {
      console.log('[AuthContext] User ID changed or first fetch, fetching profile...');
      userIdRef.current = currentUserId;
      hasFetchedProfile.current = true;
      fetchProfile();
    } else if (!currentUserId) {
      // Reset flag when user logs out
      hasFetchedProfile.current = false;
      userIdRef.current = null;
    }
  }, [user?.id, fetchProfile]);


  const openModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeModal = () => {
    setIsAuthModalOpen(false);
  };

  // Auth methods
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, userData: { full_name: string }) => {
    try {
      // Use Edge Function to create user and send custom confirmation email via Resend
      const { data: funcData, error: funcError } = await supabase.functions.invoke('signup', {
        body: {
          email,
          password,
          full_name: userData.full_name,
          redirectTo: `${window.location.origin}/confirm`
        }
      });

      if (funcError) {
        console.error('Edge Function error:', funcError);
        let errorMessage = funcError.message;
        
        // Try to parse the response body if available
        if (funcError instanceof Error && 'context' in funcError) {
          try {
            const response = (funcError as any).context as Response;
            if (response && typeof response.json === 'function') {
              const errorBody = await response.json();
              if (errorBody && errorBody.error) {
                errorMessage = errorBody.error;
              }
            }
          } catch (e) {
            console.error('Error parsing Edge Function response:', e);
          }
        }
        
        return { data: { user: null, session: null }, error: new Error(errorMessage) };
      }

      if (funcData?.error) {
        console.error('Edge Function returned error:', funcData.error);
        return { data: { user: null, session: null }, error: new Error(funcData.error) };
      }

      // Return structure mimicking supabase.auth.signUp
      return { 
        data: { 
          user: funcData.user, 
          session: null // Session is null because email confirmation is required
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: { user: null, session: null }, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      // Use Edge Function to send custom magic link via Resend
      const { data, error } = await supabase.functions.invoke('send-magic-link', {
        body: {
          email,
          redirectTo: `${window.location.origin}/callback`
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        let errorMessage = error.message;
        
        // Try to parse the response body if available
        if (error instanceof Error && 'context' in error) {
          try {
            const response = (error as any).context as Response;
            if (response && typeof response.json === 'function') {
              const errorBody = await response.json();
              if (errorBody && errorBody.error) {
                errorMessage = errorBody.error;
              }
            }
          } catch (e) {
            console.error('Error parsing Edge Function response:', e);
          }
        }
        return { error: new Error(errorMessage) };
      }

      if (data?.error) {
        console.error('Edge Function returned error:', data.error);
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Magic link error:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Use Edge Function to bypass Supabase Auth rate limits and use custom email template
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { 
          email,
          redirectTo: `${window.location.origin}/recovery`
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        let errorMessage = error.message;
        
        // Try to parse the response body if available
        if (error instanceof Error && 'context' in error) {
          try {
            const response = (error as any).context as Response;
            if (response && typeof response.json === 'function') {
              const errorBody = await response.json();
              if (errorBody && errorBody.error) {
                errorMessage = errorBody.error;
              }
            }
          } catch (e) {
            console.error('Error parsing Edge Function response:', e);
          }
        }
        return { error: new Error(errorMessage) };
      }

      if (data?.error) {
        console.error('Edge Function returned error:', data.error);
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    profileLoading,
    isAuthModalOpen,
    authMode,
    openModal,
    closeModal,
    setAuthMode,
    refetchProfile: fetchProfile,
    // Auth methods
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithLinkedIn,
    sendMagicLink,
    resetPassword,
    updatePassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};