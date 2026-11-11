"use client";
import { useEffect } from "react";
import { onMessageListener } from "@/lib/firebase";

export default function NotificationListener() {
  useEffect(() => {
    let active = true;

    const listen = async () => {
      try {
        const payload: any = await onMessageListener();

        if (Notification.permission === "granted") {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(
            payload?.notification?.title || "New Notification",
            {
              body: payload?.notification?.body || "",
              icon: "/notification-icon.png",
              data: payload?.data,
            }
          );
        }
      } catch (err) {
        console.error("Notification error:", err);
      } finally {
        if (active) listen();
      }
    };

    listen();

    return () => {
      active = false;
    };
  }, []);

  return null;
}