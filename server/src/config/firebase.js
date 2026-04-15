const admin = require('firebase-admin');

// Require the JSON file directly so we don't have to deal with .env string parsing errors
const serviceAccount = require('../../serviceAccountKey.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const db = admin.firestore();
const messaging = admin.messaging();
const storage = admin.storage();

module.exports = { admin, db, messaging, storage };
