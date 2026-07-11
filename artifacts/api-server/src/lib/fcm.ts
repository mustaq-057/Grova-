import * as admin from 'firebase-admin';

// We initialize Firebase Admin lazily to avoid crashing on boot if the service account isn't set up yet.
let fcmInitialized = false;
let fcmApp: admin.app.App | null = null;

function initFirebase(): boolean {
  if (fcmInitialized && fcmApp) return true;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
      console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT env variable is missing. Push notifications are disabled.');
      return false;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    // Avoid re-initializing if already done (Vercel warm functions)
    if (admin.apps.length > 0) {
      fcmApp = admin.apps[0]!;
    } else {
      fcmApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    fcmInitialized = true;
    console.log('[FCM] Firebase Admin initialized successfully.');
    return true;
  } catch (error) {
    console.error('[FCM] Failed to initialize Firebase Admin:', error);
    return false;
  }
}

/**
 * Send a push notification to a specific device token.
 *
 * We intentionally use a DATA-ONLY FCM message (no top-level `notification` block).
 *
 * Why: Samsung One UI and Vivo FuntouchOS intercept "notification" payloads and
 * hand them directly to the OS tray when the app is killed — they never wake the
 * FirebaseMessagingService. The result is either a silent drop or a severely delayed
 * notification. A data-only message bypasses this: FCM delivers it at HIGH priority,
 * the FirebaseMessagingService is woken up, and the Capacitor plugin shows the local
 * notification with full heads-up behaviour.
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  if (!initFirebase() || !fcmApp) return false;

  try {
    const message: admin.messaging.Message = {
      token,
      // ── DATA-ONLY: no top-level `notification` object ─────────────────
      // The Capacitor PushNotifications plugin reads these data fields and
      // displays a heads-up notification locally via the Android channel.
      data: {
        title,
        body,
        channelId: 'grova_messages',
        sound: 'default',
        ...(data ?? {}),
      },
      android: {
        // HIGH priority wakes the device even in Doze mode
        priority: 'high',
        // 4-hour TTL — if the device is offline longer the message is dropped
        // rather than flooding the user with stale notifications
        ttl: 4 * 60 * 60 * 1000,
        // collapse_key so rapid-fire messages don't pile up
        collapseKey: 'grova_message',
        // directBootOk lets the service run on a locked (direct boot) device
        directBootOk: true,
        // Do NOT set android.notification here — that would reintroduce the
        // OS-tray interception we're explicitly trying to avoid.
      },
      // FCM options for delivery analytics
      fcmOptions: {
        analyticsLabel: 'grova_message',
      },
    };

    const response = await admin.messaging(fcmApp).send(message);
    console.log(`[FCM] Sent data message to ${token.substring(0, 8)}...: ${response}`);
    return true;
  } catch (error: any) {
    // If the token is invalid/unregistered, log clearly so it can be cleaned up
    const errCode: string = error?.errorInfo?.code ?? error?.code ?? '';
    if (
      errCode.includes('registration-token-not-registered') ||
      errCode.includes('invalid-registration-token')
    ) {
      console.warn(`[FCM] Stale token for ${token.substring(0, 8)}... — should be removed from DB`);
    } else {
      console.error('[FCM] Error sending push notification:', error);
    }
    return false;
  }
}

