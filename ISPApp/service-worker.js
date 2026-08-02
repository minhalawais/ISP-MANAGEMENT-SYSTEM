// service-worker.js

self.addEventListener('push', function (event) {
  const options = {
    body: event.data.text(),
    icon: 'icon.png', // Replace with the path to your notification icon
  };

  event.waitUntil(
    self.registration.showNotification('Push Notification', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  // Add code here to handle notification click, e.g., open a specific URL
});
