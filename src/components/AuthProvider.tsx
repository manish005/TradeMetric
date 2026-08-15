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
import { startTracking, stopTracking } from "@/lib/analytics";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  busy: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  busy: false,
  error: null,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authRef = useRef<Auth | null>(null);
  const providerRef = useRef<GoogleAuthProvider | null>(null);
  const authReadyRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    // Never let Firebase stall the header UI: fall back to signed-out state.
    const fallback = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 6000);

    const finishRedirectResult = async (
      auth: Auth,
      getRedirectResult: (
        auth: Auth
      ) => Promise<import("firebase/auth").UserCredential | null>
    ) => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user && !cancelled) {
          setUser(result.user);
          setReady(true);
          return true;
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? `Sign-in failed: ${e.message}` : "Sign-in failed — please try again."
          );
        }
      }
      return false;
    };

    authReadyRef.current = (async () => {
      void initAnalytics();
      const {
        getAuth,
        GoogleAuthProvider,
        getRedirectResult,
        setPersistence,
        browserLocalPersistence,
      } = await import("firebase/auth");
      const { app } = await import("@/lib/firebase");
      const auth = getAuth(app);
      authRef.current = auth;
      providerRef.current = new GoogleAuthProvider();
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        // persistence not available — use whatever Firebase defaults to
      }
      const signedInFromRedirect = await finishRedirectResult(auth, getRedirectResult);
      unsub = auth.onAuthStateChanged((u) => {
        if (!cancelled) {
          setUser(u);
          setReady(true);
        }
      });
      try {
        await auth.authStateReady();
      } catch {
        // state could not be resolved — the onAuthStateChanged fallback covers UI
      }
      if (!signedInFromRedirect && !cancelled) {
        const u = auth.currentUser;
        if (u) {
          setUser(u);
          setReady(true);
        }
      }
    })().catch(() => {
      if (!cancelled) setReady(true);
    });

    // Mobile browsers (Android Chrome, iOS Safari, in-app webviews) can
    // restore the page from back-forward cache instead of reloading after
    // the Google redirect — the mount effect never re-runs, so the user
    // appears signed-out forever. Re-check on `pageshow`.
    const onPageshow = () => {
      if (cancelled || !authRef.current) return;
      void import("firebase/auth").then(({ getRedirectResult }) => {
        if (cancelled || !authRef.current) return;
        void getRedirectResult(authRef.current)
          .then((result) => {
            if (result?.user && !cancelled) {
              setUser(result.user);
              setReady(true);
            }
          })
          .catch(() => {
            // nothing pending — normal navigation
          });
      });
    };
    window.addEventListener("pageshow", onPageshow);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      window.removeEventListener("pageshow", onPageshow);
      if (unsub) unsub();
    };
  }, []);

  const signInWithGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const { signInWithPopup, signInWithRedirect } = await import("firebase/auth");
      await authReadyRef.current;
      const auth = authRef.current;
      const provider = providerRef.current;
      if (!auth || !provider) throw new Error("Sign-in not ready yet — try again in a moment.");
      const smallScreen =
        typeof window !== "undefined" &&
        (window.matchMedia("(max-width: 1023px)").matches || "ontouchstart" in window);
      if (smallScreen) {
        // Popup works on most modern mobile browsers; redirect is the
        // fallback for webviews that block popups.
        try {
          await signInWithPopup(auth, provider);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "";
          if (
            !msg.includes("popup-blocked") &&
            !msg.includes("auth/popup-blocked") &&
            !msg.includes("popup-closed")
          ) {
            throw e;
          }
          await signInWithRedirect(auth, provider);
        }
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-in failed — please try again.";
      setError(
        msg.includes("popup-closed") ||
          msg.includes("cancelled") ||
          msg.includes("not ready") ||
          msg.includes("popup-blocked")
          ? msg.includes("popup-blocked")
            ? "Popup blocked — switch to redirect sign-in or allow popups."
            : msg
          : "Sign-in failed — please try again."
      );
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

  // Session analytics: heartbeat every 30s, flush on hide/unload
  useEffect(() => {
    if (user) {
      startTracking(user);
      return () => stopTracking();
    }
    stopTracking();
    return undefined;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, ready, busy, error, signInWithGoogle, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);