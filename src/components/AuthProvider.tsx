"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Auth, GoogleAuthProvider, User } from "firebase/auth";
import { initAnalytics } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  busy: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  busy: false,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const authRef = useRef<Auth | null>(null);
  const providerRef = useRef<GoogleAuthProvider | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    // Never let Firebase stall the header UI: fall back to signed-out state.
    const fallback = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 4000);
    void (async () => {
      void initAnalytics();
      try {
        const { getAuth, GoogleAuthProvider } = await import("firebase/auth");
        const { app } = await import("@/lib/firebase");
        const auth = getAuth(app);
        authRef.current = auth;
        providerRef.current = new GoogleAuthProvider();
        unsub = auth.onAuthStateChanged((u) => {
          if (!cancelled) {
            setUser(u);
            setReady(true);
          }
        });
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(fallback);
      if (unsub) unsub();
    };
  }, []);

  const signInWithGoogle = async () => {
    const auth = authRef.current;
    const provider = providerRef.current;
    if (!auth || !provider) return;
    setBusy(true);
    try {
      const { signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(auth, provider);
    } finally {
      setBusy(false);
    }
  };

  const signOutUser = async () => {
    const auth = authRef.current;
    if (!auth) return;
    setBusy(true);
    try {
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, busy, signInWithGoogle, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);