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
 * We include BOTH the `notification` block (so Android OS shows it when app is killed)
 * and the `data` block (so the app can route it when tapped/foregrounded).
 * By explicitly setting the `channelId` to 'grova_messages' (which has HIGH importance),
 * we bypass the silent-drop issues on Samsung/Vivo.
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
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        channelId: 'grova_messages',
        sound: 'default',
        ...(data ?? {}),
      },
      android: {
        priority: 'high',
        ttl: 4 * 60 * 60 * 1000,
        collapseKey: 'grova_message',
        directBootOk: true,
        notification: {
          channelId: 'grova_messages',
          sound: 'default',
          clickAction: 'FCM_PLUGIN_ACTIVITY',
        }
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

