import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearEncoreSession, isEncoreRequestError } from '@/lib/encore-client';
import { getEncoreSessionProfile, signInWithGoogle, signInWithPassword, signUpWithPassword, type VerificationEmailStatus } from '@/lib/identity-client';
import { UserProfile, UserRole } from '@/types';

export interface AuthSessionUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string;
}

interface LoginParams {
  email: string;
  password: string;
}

interface SignupParams {
  email: string;
  displayName: string;
  password: string;
  role?: UserRole;
  photoUrl?: string | null;
  referredByCode?: string | null;
}

interface GoogleSigninParams {
  credential: string;
  role?: UserRole;
  referredByCode?: string | null;
}

interface AuthContextType {
  user: AuthSessionUser | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  refreshProfile: () => Promise<UserProfile | null>;
  signIn: (params: LoginParams) => Promise<UserProfile>;
  signUp: (params: SignupParams) => Promise<{ profile: UserProfile; verificationEmailStatus: VerificationEmailStatus }>;
  signInWithGoogle: (params: GoogleSigninParams) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  refreshProfile: async () => null,
  signIn: async () => {
    throw new Error('Auth context not ready.');
  },
  signUp: async () => {
    throw new Error('Auth context not ready.');
  },
  signInWithGoogle: async () => {
    throw new Error('Auth context not ready.');
  },
  logout: async () => {},
});

function toSessionUser(profile: UserProfile): AuthSessionUser {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    photoUrl: profile.photoUrl || '',
  };
}

function isUnauthenticatedSessionError(error: unknown) {
  if (isEncoreRequestError(error)) {
    return error.status === 401 || error.code === 'unauthenticated';
  }

  return error instanceof Error && error.message.toLowerCase().includes('unauthenticated');
}

function isSessionInfrastructureError(error: unknown) {
  if (isEncoreRequestError(error)) {
    return error.status >= 500 || error.status === 0;
  }

  return error instanceof TypeError;
}

function getSessionRestoreErrorMessage(error: unknown) {
  if (isSessionInfrastructureError(error)) {
    return 'Could not reach the Ideal Stay backend. Some account features may be unavailable until the connection recovers.';
  }

  return 'Could not restore your session. Please sign in again if account features are unavailable.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const logout = async () => {
    await clearEncoreSession();
    setUser(null);
    setProfile(null);
    setAuthError(null);
  };

  const refreshProfile = async () => {
    try {
      const nextProfile = await getEncoreSessionProfile();
      setProfile(nextProfile);
      setUser(toSessionUser(nextProfile));
      setAuthError(null);
      return nextProfile;
    } catch (error) {
      console.error('Error refreshing Encore profile:', error);
      if (isUnauthenticatedSessionError(error)) {
        await logout();
      } else {
        setAuthError(getSessionRestoreErrorMessage(error));
      }
      return null;
    }
  };

  const signUp = async ({ email, displayName, password, role = 'guest', photoUrl = null, referredByCode }: SignupParams) => {
    const signupResult = await signUpWithPassword({
      email,
      displayName,
      password,
      photoUrl,
      role,
      referredByCode,
    });
    setProfile(signupResult.profile);
    setUser(toSessionUser(signupResult.profile));
    setAuthError(null);
    return signupResult;
  };

  const signIn = async ({ email, password }: LoginParams) => {
    const nextProfile = await signInWithPassword({ email, password });
    setProfile(nextProfile);
    setUser(toSessionUser(nextProfile));
    setAuthError(null);
    return nextProfile;
  };

  const signInGoogle = async ({ credential, role, referredByCode }: GoogleSigninParams) => {
    const nextProfile = await signInWithGoogle({ credential, role, referredByCode });
    setProfile(nextProfile);
    setUser(toSessionUser(nextProfile));
    setAuthError(null);
    return nextProfile;
  };

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const nextProfile = await getEncoreSessionProfile();
        if (cancelled) return;
        setProfile(nextProfile);
        setUser(toSessionUser(nextProfile));
        setAuthError(null);
      } catch (error) {
        if (isUnauthenticatedSessionError(error)) {
          if (!cancelled) {
            setUser(null);
            setProfile(null);
            setAuthError(null);
          }
          return;
        }

        console.error('Error restoring Encore session:', error);
        if (!cancelled) {
          setAuthError(getSessionRestoreErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, refreshProfile, signIn, signUp, signInWithGoogle: signInGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
