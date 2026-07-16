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

    // Strip surrounding single-quotes that some .env parsers leave in place
    const cleaned = serviceAccountJson.trim().replace(/^'([\s\S]*)'$/, '$1');
    const serviceAccount = JSON.parse(cleaned);

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
 * We include BOTH the `notification` block (so Android OS shows it when app is killed)
 * and the `data` block (so the app can route it when tapped/foregrounded).
 * By explicitly setting the `channelId` to 'grova_messages' (which has HIGH importance),
 * we bypass the silent-drop issues on Samsung/Vivo.
 *
 * Throws an error with code 'FCM_STALE_TOKEN' when the token is unregistered,
 * so callers can remove it from the database.
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
      // ⚠️  REQUIRED — the FCM registration token of the target device
      token,
      notification: {
        title,
        body,
      },
      data: {
        // Mirror title/body into data so Capacitor foreground handler can read them
        title,
        body,
        channelId: 'grova_messages',
        sound: 'default',
        ...(data ?? {}),
      },
      android: {
        priority: 'high',
        // ttl in milliseconds for the Admin SDK (4 hours)
        ttl: 4 * 60 * 60 * 1000,
        collapseKey: 'grova_message',
        notification: {
          channelId: 'grova_messages',
          sound: 'default',
          clickAction: 'FCM_PLUGIN_ACTIVITY',
          // ic_launcher is guaranteed to exist in every APK build
          icon: 'ic_launcher',
          color: '#e91e8c',
        },
      },
      fcmOptions: {
        analyticsLabel: 'grova_message',
      },
    };

    const response = await admin.messaging(fcmApp).send(message);
    console.log(`[FCM] ✅ Sent to ${token.substring(0, 8)}...: ${response}`);
    return true;
  } catch (error: any) {
    const errCode: string = error?.errorInfo?.code ?? error?.code ?? '';
    if (
      errCode.includes('registration-token-not-registered') ||
      errCode.includes('invalid-registration-token')
    ) {
      console.warn(`[FCM] ⚠️  Stale token ${token.substring(0, 8)}... — will be removed from DB`);
      // Signal stale token to caller so it can clean up the DB row
      const e = new Error('FCM_STALE_TOKEN');
      (e as any).code = 'FCM_STALE_TOKEN';
      throw e;
    }
    console.error('[FCM] Error sending push notification:', error);
    return false;
  }
}
