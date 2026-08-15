"use client";

import type { User } from "firebase/auth";

let dbCache: Promise<import("firebase/firestore").Firestore | null> | null = null;

async function getDb() {
  if (!dbCache) {
    dbCache = (async () => {
      try {
        const { getFirestore } = await import("firebase/firestore");
        const { app } = await import("@/lib/firebase");
        return getFirestore(app);
      } catch {
        return null;
      }
    })();
  }
  return dbCache;
}

let uidKey: string | null = null;
let sessionKey = "";
let sessionStarted = 0;
let timer: number | null = null;
let eventCleanup: (() => void) | null = null;

export async function syncUserProfile(u: User) {
  const d = await getDb();
  if (!d || !u.uid) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(
      doc(d, "users", u.uid),
      {
        email: u.email ?? null,
        name: u.displayName ?? null,
        photoURL: u.photoURL ?? null,
        createdAt: Date.now(),
        lastSeen: Date.now(),
      },
      { merge: true }
    );
  } catch {
    // Firestore rules/offline – ignore, never block the app
  }
}

export async function flushSession(final = false) {
  const d = await getDb();
  if (!d || !uidKey || !sessionKey) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const now = Date.now();
    await setDoc(
      doc(d, "sessions", sessionKey),
      {
        uid: uidKey,
        startedAt: sessionStarted,
        durationSec: Math.round((now - sessionStarted) / 1000),
        active: !final,
        updatedAt: now,
      },
      { merge: true }
    );
    await setDoc(
      doc(d, "users", uidKey),
      { lastSeen: now },
      { merge: true }
    );
  } catch {
    // offline – the next heartbeat retries
  }
}

export function startTracking(u: User) {
  if (typeof window === "undefined" || !u.uid || uidKey === u.uid) return;
  stopTracking();
  uidKey = u.uid;
  sessionStarted = Date.now();
  sessionKey = `${u.uid}-${sessionStarted}`;
  void syncUserProfile(u);
  void flushSession(false);
  timer = window.setInterval(() => void flushSession(false), 30000);

  const endNow = () => void flushSession(true);
  const onHide = () => {
    if (document.visibilityState === "hidden") endNow();
  };
  window.addEventListener("beforeunload", endNow);
  document.addEventListener("visibilitychange", onHide);
  eventCleanup = () => {
    window.removeEventListener("beforeunload", endNow);
    document.removeEventListener("visibilitychange", onHide);
  };
}

export function stopTracking() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  if (eventCleanup) {
    eventCleanup();
    eventCleanup = null;
  }
  sessionKey = "";
  uidKey = null;
}