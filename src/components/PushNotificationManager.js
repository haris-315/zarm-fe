import React, { useState } from 'react';
import { subscribeToPushNotifications, sendTestNotification } from '../utils/pushNotifications';
import { Button } from './Button';
import styles from './PushNotificationManager.module.css';

const PushNotificationManager = () => {
  const [status, setStatus] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true);
      setStatus('Subscribing...');
      await subscribeToPushNotifications();
      setStatus('Successfully subscribed!');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setStatus('Sending test notification...');
      await sendTestNotification();
      setStatus('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Push Notifications</h3>
      <div className={styles.actions}>
        <Button 
          variant="secondary"
          onClick={handleSubscribe} 
          loading={isSubscribing}
        >
          {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
        </Button>
        <Button 
          variant="primary"
          onClick={handleTestNotification}
        >
          Send Test Notification
        </Button>
      </div>
      {status && <div className={styles.status}>{status}</div>}
    </div>
  );
};

export default PushNotificationManager;
