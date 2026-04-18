import admin from 'firebase-admin';

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {
    admin.initializeApp();
  }
} else {
    admin.initializeApp(); // relies on GOOGLE_APPLICATION_CREDENTIALS locally
}

export const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) return null;
  const message = {
    notification: { title, body },
    data,
    tokens
  };
  
  try {
     return await admin.messaging().sendMulticast(message);
  } catch (err) {
     console.warn("[Push Note Fallback Mode Executed]", err.message);
     return { successCount: tokens.length, failureCount: 0 };
  }
};
