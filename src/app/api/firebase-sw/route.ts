/**
 * GET /api/firebase-sw
 * Serves the Firebase Messaging service worker with runtime config injected.
 * Registered in useFcmToken as the service worker URL.
 * The Service-Worker-Allowed header grants it scope over the whole origin.
 */
export async function GET() {
  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const js = `
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

// Show a system notification when the app is in the background,
// and also postMessage all open tabs so they can play sound and refresh orders instantly.
messaging.onBackgroundMessage(function(payload) {
  const title = payload.data?.title || payload.notification?.title || 'New Notification';
  const body  = payload.data?.body  || payload.notification?.body  || '';

  // Notify any open app tabs so they can play sound + refresh without waiting
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
    clientList.forEach(function(client) {
      client.postMessage({ type: 'FCM_BACKGROUND_MESSAGE', data: payload.data });
    });
  });

  self.registration.showNotification(title, {
    body,
    icon: '/file.svg',
    badge: '/file.svg',
    tag: payload.data?.orderId || 'order-notification', // prevents duplicate system notifications
    data: payload.data,
  });
});

// When user clicks the system notification, focus the app window
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/dashboard/owner/orders');
    })
  );
});
`;

  return new Response(js, {
    headers: {
      "Content-Type":          "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "Cache-Control":         "no-cache, no-store, must-revalidate",
    },
  });
}
