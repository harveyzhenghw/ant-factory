import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getFirebaseConfigError } from '../services/firebase';
import { UserProfile } from '../types';
import { getUserProfile } from '../services/auth';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configError: string | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  configError: null,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    configError: null,
    refreshProfile: async () => {},
  });

  const refreshProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    const profile = await getUserProfile(user);
    setState((prev) => ({ ...prev, profile }));
  }, []);

  useEffect(() => {
    const configError = getFirebaseConfigError();
    if (configError) {
      setState({ user: null, profile: null, loading: false, configError, refreshProfile });
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user);
        setState({ user, profile, loading: false, configError: null, refreshProfile });
      } else {
        setState({ user: null, profile: null, loading: false, configError: null, refreshProfile });
      }
    });
    return unsub;
  }, [refreshProfile]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
