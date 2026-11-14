"use client";
import { useEffect } from "react";
import { subscribeToMessages } from "@/lib/firebase";

/** Shows a system notification for push messages that arrive while the portal is open. */
export default function NotificationListener() {
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    let active = true;

    subscribeToMessages(async (payload) => {
      try {
        if (Notification.permission !== "granted") return;
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(payload.notification?.title || "New Notification", {
          body: payload.notification?.body || "",
          icon: "/notification-icon.png",
          data: payload.data,
        });
      } catch (err) {
        console.error("Notification error:", err);
      }
    }).then((off) => {
      // The component may have unmounted while Firebase was loading.
      if (active) unsubscribe = off;
      else off();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return null;
}
