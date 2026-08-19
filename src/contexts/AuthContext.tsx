import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getFirebaseConfigError } from '../services/firebase';
import { UserProfile } from '../types';
import { getUserProfile, ensureUserProfile } from '../services/auth';

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

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setState({ user: null, profile: null, loading: false, configError: null, refreshProfile });
        return;
      }

      // Render the app as soon as auth is known. Do NOT block the loading
      // spinner on the profile read: a slow/failed Realtime Database request
      // (wrong region, denied rules, offline) must not hang the whole app.
      setState({ user, profile: null, loading: false, configError: null, refreshProfile });

      // Read the profile, self-healing a missing record so every signed-in
      // account always ends up with one (covers the Google-signup race).
      ensureUserProfile(user)
        .then((profile) => {
          setState((prev) => (prev.user?.uid === user.uid ? { ...prev, profile } : prev));
        })
        .catch((e) => {
          console.warn('Failed to load user profile', e);
        });
    });
    return unsub;
  }, [refreshProfile]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
