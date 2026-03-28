// Service Worker for Web Push notifications
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "Tether", body: event.data?.text() ?? "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Tether", {
      body: data.body ?? "",
      icon: "/icon-192.png",
      data: { url: data.url ?? "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
