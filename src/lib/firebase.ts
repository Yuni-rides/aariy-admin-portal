import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, MessagePayload, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** False when the Firebase env vars are missing (e.g. a deploy without them); push notifications are then off. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId,
);

const getFirebaseApp = (): FirebaseApp | null =>
  isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

/** Messaging needs the config plus a browser that supports it (service workers, push, not every Safari). */
const getMessagingSafe = async (): Promise<Messaging | null> => {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return (await isSupported()) ? getMessaging(app) : null;
  } catch {
    return null;
  }
};

export const requestForToken = async (): Promise<string | null> => {
  try {
    if (!("serviceWorker" in navigator)) return null;
    const messaging = await getMessagingSafe();
    if (!messaging) return null;
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    if (!currentToken) {
      console.warn("No registration token available. Request permission to generate one.");
      return null;
    }
    return currentToken;
  } catch (err) {
    console.error("An error occurred while retrieving token: ", err);
    return null;
  }
};

/**
 * Calls `handler` for every foreground push message. Returns an unsubscribe
 * function; it does nothing when Firebase isn't set up or supported.
 */
export const subscribeToMessages = async (
  handler: (payload: MessagePayload) => void,
): Promise<() => void> => {
  const messaging = await getMessagingSafe();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
};
