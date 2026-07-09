import * as admin from 'firebase-admin';

// We initialize Firebase Admin lazily to avoid crashing on boot if the service account isn't set up yet.
let fcmInitialized = false;

function initFirebase() {
  if (fcmInitialized) return true;
  
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountJson) {
      console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT env variable is missing. Push notifications are disabled.');
      return false;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
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
 */
export async function sendPushNotification(
  token: string, 
  title: string, 
  body: string, 
  data?: Record<string, string>
): Promise<boolean> {
  if (!initFirebase()) return false;

  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'grova_messages', // This channel ID should match the frontend config
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`[FCM] Successfully sent message to ${token.substring(0, 8)}... :`, response);
    return true;
  } catch (error) {
    console.error('[FCM] Error sending push notification:', error);
    return false;
  }
}
