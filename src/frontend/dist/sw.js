/**
 * FASTag Toll Alert — Service Worker
 *
 * Keeps the app alive in the background so balance/toll alerts
 * reach the user even when the screen is off or the browser is
 * backgrounded.
 *
 * Handles:
 *  - install / activate lifecycle (claim all clients immediately)
 *  - UPDATE_STATE messages from the page (balance, distanceKm)
 *  - Shows a persistent notification when balance is low near a toll
 */

const CACHE_NAME = "fastag-v1";

// App state sent from the page via postMessage
let appState = {
  balance: 0,
  vehicleType: "",
  nearestToll: null,
  distanceKm: 999,
};

// Throttle: only show notification once per toll per approach
const notifiedTolls = new Map(); // tollName → timestamp
const NOTIFY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// ─── Lifecycle ───────────────────────────────────────────────────────────────

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Fetch (cache-first for app shell assets) ─────────────────────────────────

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only cache same-origin GET requests for static assets
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cache successful static asset responses
        if (
          response.ok &&
          (url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".html") ||
            url.pathname.endsWith(".woff2") ||
            url.pathname === "/")
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ─── Messages from page ───────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "UPDATE_STATE") {
    const prev = appState;
    appState = { ...appState, ...event.data };

    const { balance, nearestToll, distanceKm } = appState;

    // Show low-balance alert when approaching within 5 km
    if (
      nearestToll &&
      distanceKm <= 5 &&
      balance < 150
    ) {
      const lastNotified = notifiedTolls.get(nearestToll);
      const now = Date.now();

      if (!lastNotified || now - lastNotified > NOTIFY_COOLDOWN_MS) {
        notifiedTolls.set(nearestToll, now);

        self.registration.showNotification("⚠️ FASTag Alert — Low Balance!", {
          body: `Approaching ${nearestToll} in ${distanceKm.toFixed(1)} km. Balance: ₹${balance}. Please recharge now!`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "fastag-low-balance",
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200, 100, 400],
          actions: [
            { action: "open", title: "Open App" },
            { action: "dismiss", title: "Dismiss" },
          ],
        });
      }
    }

    // Reset cooldown when user moves away from the toll (> 6km)
    if (prev.nearestToll && distanceKm > 6) {
      notifiedTolls.delete(prev.nearestToll);
    }
  }
});

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  // Focus existing window or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow("/");
    })
  );
});
