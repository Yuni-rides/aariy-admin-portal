importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyDiQm8XQlAv87Po00zm3vt2iPzOWzCt2ME",
  authDomain: "arigo-5463f.firebaseapp.com",
  projectId: "arigo-5463f",
  storageBucket: "arigo-5463f.firebasestorage.app",
  messagingSenderId: "823062549517",
  appId: "1:823062549517:web:c20a5a19d7c015b81d3144",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message received ",
    payload,
  );

  self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      console.log("[SW] Clients found:", clients.length);
      clients.forEach((client) => {
        client.postMessage({
          type: "BACKGROUND_NOTIFICATION",
          payload: payload,
        });
      });
    });

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/notification-icon.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const metadata = event.notification.data;

  let targetUrl = "/school-transportation";

  if (metadata && metadata.type === "NEW_DRIVER_SIGNUP" && metadata.driverId) {
    targetUrl = `/school-transportation/drivers/${metadata.driverId}`;
  }

  const fullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.includes(self.location.origin) &&
            "navigate" in client
          ) {
            return client.focus().then(() => client.navigate(fullUrl));
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      }),
  );
});
