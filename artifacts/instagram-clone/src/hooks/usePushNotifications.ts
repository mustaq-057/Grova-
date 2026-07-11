import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { apiFetch } from '../lib/api';

export function usePushNotifications() {
  useEffect(() => {
    // Only register on native devices (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const registerPushNotifications = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('[Push] User denied push notification permission');
          return;
        }

        // Create notification channel for Android 8+
        if (Capacitor.getPlatform() === 'android') {
          try {
            await PushNotifications.createChannel({
              id: 'grova_messages',
              name: 'Grovaa Messages',
              description: 'Notifications for new messages and calls',
              importance: 5, // High importance (heads-up notification)
              visibility: 1, // Public
              vibration: true,
            });
            console.log('[Push] Notification channel created successfully');
          } catch (e) {
            console.error('[Push] Failed to create notification channel:', e);
          }
        }

        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();

        // Listeners for push notification events
        PushNotifications.addListener('registration', async (token: Token) => {
          console.log('[Push] Registration token: ', token.value);
          // Send token to our API server
          try {
            await apiFetch('/push/fcm-token', {
              method: 'POST',
              body: JSON.stringify({ token: token.value }),
            });
            console.log('[Push] Token successfully saved on server');
          } catch (err) {
            console.error('[Push] Failed to save token on server:', err);
          }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('[Push] Error on registration: ', JSON.stringify(error));
        });

        PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            console.log('[Push] Notification received in foreground: ', notification);
            // Optionally show a toast here if needed
          }
        );

        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('[Push] Notification action performed: ', notification);
            const data = notification.notification.data;
            if (data && data.type === 'message') {
              // Can navigate to chat here using wouter
              window.location.href = '/chat';
            } else if (data && data.type === 'call') {
              window.location.href = '/chat';
            }
          }
        );

      } catch (err) {
        console.error('[Push] Failed to register push notifications', err);
      }
    };

    registerPushNotifications();

    // Cleanup listeners on unmount
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);
}
