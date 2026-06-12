import apiClient from '../api/client';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported by this browser.');
  }
  if (!('PushManager' in window)) {
    throw new Error('Push notifications are not supported by this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission not granted for Notification');
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register('/push-sw.js');

  // Fetch VAPID key
  const response = await apiClient.get('/push/vapid-public-key');
  const vapidPublicKey = response.data.public_key;
  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey
  });

  const subscriptionJSON = subscription.toJSON();
  
  // Send subscription to backend
  await apiClient.post('/push/subscribe', {
    endpoint: subscriptionJSON.endpoint,
    keys: {
      p256dh: subscriptionJSON.keys.p256dh,
      auth: subscriptionJSON.keys.auth
    }
  });

  return subscription;
};

export const sendTestNotification = async () => {
  const response = await apiClient.post('/push/test');
  return response.data;
};
