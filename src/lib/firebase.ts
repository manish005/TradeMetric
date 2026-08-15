import { initializeApp, type FirebaseApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyCeavPGDQCbRl_o3xDTAekBNNw-AdSTdlU",
  authDomain: "www.tradermatrix.in",
  projectId: "growtherr",
  storageBucket: "growtherr.firebasestorage.app",
  messagingSenderId: "1001651518110",
  appId: "1:1001651518110:web:2427b5549c674889e5998f",
  measurementId: "G-ZH6GL37MM7",
};

export const app: FirebaseApp = initializeApp(firebaseConfig);

let analyticsInitialized = false;

export async function initAnalytics() {
  if (analyticsInitialized || typeof window === "undefined") return;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) {
      getAnalytics(app);
      analyticsInitialized = true;
    }
  } catch {
    analyticsInitialized = true;
  }
}