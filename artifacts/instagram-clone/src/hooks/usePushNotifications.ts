import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, type Token, type ActionPerformed, type PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { apiFetch } from '../lib/api';

export function usePushNotifications() {
  const registeredRef = useRef(false);

  useEffect(() => {
    // Only register on native Android/iOS — never in browser
    if (!Capacitor.isNativePlatform()) return;
    // Prevent double-registration on hot reload / StrictMode re-mount
    if (registeredRef.current) return;
    registeredRef.current = true;

    const registerPushNotifications = async () => {
      try {
        // ── 1. Check / request push permission ──────────────────────────
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
          console.warn('[Push] User denied push notification permission');
          return;
        }

        // ── 2. Request LocalNotifications permission (needed to show ─────
        //       heads-up from data-only FCM on Android 13+)
        if (Capacitor.getPlatform() === 'android') {
          try {
            const localPerm = await LocalNotifications.checkPermissions();
            if (localPerm.display !== 'granted') {
              await LocalNotifications.requestPermissions();
            }
          } catch {
            // LocalNotifications plugin may not be installed — skip silently
          }
        }

        // ── 3. Create notification channel (Android 8+) ──────────────────
        //   importance: 4 = IMPORTANCE_HIGH → shows heads-up banner
        //   importance: 5 = IMPORTANCE_MAX  → Samsung One UI demotes this!
        if (Capacitor.getPlatform() === 'android') {
          try {
            await PushNotifications.createChannel({
              id: 'grova_messages',
              name: 'Grovaa Messages',
              description: 'Notifications for new messages and calls',
              importance: 4,  // HIGH — correct value for heads-up on Samsung
              visibility: 1,  // Public — show on lock screen
              vibration: true,
              sound: 'default',
            });
            console.log('[Push] Notification channel created');
          } catch (e) {
            console.error('[Push] Failed to create channel:', e);
          }
        }

        // ── 4. Add listeners BEFORE calling register() ───────────────────
        await PushNotifications.addListener('registration', async (token: Token) => {
          console.log('[Push] FCM token received:', token.value.substring(0, 12) + '…');
          try {
            await apiFetch('/push/fcm-token', {
              method: 'POST',
              body: JSON.stringify({ token: token.value }),
            });
            console.log('[Push] Token saved on server');
          } catch (err) {
            console.error('[Push] Failed to save token:', err);
          }
        });

        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('[Push] Registration error:', JSON.stringify(error));
        });

        // ── 5. Handle DATA-ONLY FCM messages (Samsung/Vivo foreground) ───
        //   Our server sends data-only messages so Samsung/Vivo can't
        //   suppress them. When the app is in the foreground we must
        //   manually display a local notification.
        await PushNotifications.addListener(
          'pushNotificationReceived',
          async (notification: PushNotificationSchema) => {
            console.log('[Push] Foreground data message received:', notification);
            const title = notification.data?.title ?? notification.title ?? 'Grovaa';
            const body = notification.data?.body ?? notification.body ?? 'New message';
            try {
              await LocalNotifications.schedule({
                notifications: [{
                  id: Math.floor(Math.random() * 100000),
                  title,
                  body,
                  channelId: 'grova_messages',
                  sound: undefined, // uses channel default
                  smallIcon: 'ic_stat_icon_config_sample',
                  iconColor: '#e91e8c',
                  extra: notification.data ?? {},
                }],
              });
            } catch {
              // LocalNotifications not available — ignore
            }
          }
        );

        // ── 6. Handle notification tap (background / killed) ─────────────
        await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('[Push] Notification tapped:', notification);
            const data = notification.notification.data ?? {};
            // Navigate to chat regardless of type
            window.location.href = '/chat';
          }
        );

        // ── 7. Register with FCM ─────────────────────────────────────────
        await PushNotifications.register();
        console.log('[Push] PushNotifications.register() called');

      } catch (err) {
        console.error('[Push] Failed to register push notifications:', err);
      }
    };

    void registerPushNotifications();

    // Clean up all listeners on unmount
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners().catch(() => {});
        registeredRef.current = false;
      }
    };
  }, []);
}

