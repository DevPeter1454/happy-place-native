import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  signIn as signInService,
  signUp as signUpService,
  signOutUser,
  resetPassword as resetPasswordService,
} from '../services/auth.service';
import { getProfile } from '../services/user.service';
import type { UserProfile } from '../types/models';

interface AuthContextValue {
  /** The Firebase auth user, or null when signed out. */
  user: User | null;
  /** The Firestore profile document for the signed-in user. */
  profile: UserProfile | null;
  /** True until the first auth state has been resolved on app launch. */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Re-fetch the profile doc (e.g. after a profile edit). */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      setProfile(await getProfile(uid));
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await loadProfile(nextUser.uid);
      } else {
        setProfile(null);
      }
      setInitializing(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInService(email, password);
    // onAuthStateChanged will populate user + profile.
  }, []);

  const signUp = useCallback(
    async (fullName: string, email: string, password: string) => {
      const newUser = await signUpService(fullName, email, password);
      // Account creation already triggers onAuthStateChanged → navigation to
      // Main. Eagerly load the freshly-created profile so Main greets by name
      // without waiting for the listener's (pre-profile) load to be refreshed.
      await loadProfile(newUser.uid);
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await resetPasswordService(email);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.uid);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        initializing,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
