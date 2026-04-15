const { db } = require('../config/firebase');

/**
 * Called after admin announces a result.
 * Writes the result to Firestore so all clients update in realtime via onSnapshot.
 * Non-fatal — MySQL is the source of truth, Firestore is just the realtime cache.
 */
async function syncResultToFirestore(drawId, resultData) {
  try {
    await db.collection('draws').doc(drawId).set(
      {
        status: 'completed',
        result: resultData,
        completedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`✅ Firestore synced: draw ${drawId}`);
  } catch (err) {
    console.error('❌ Firestore result sync failed:', err.message);
  }
}

/**
 * Called whenever a draw status changes (open → closed → processing → completed).
 * Lets the frontend countdown timer know the draw is no longer accepting tickets.
 */
async function syncDrawStatusToFirestore(drawId, status) {
  try {
    await db.collection('draws').doc(drawId).set(
      { status, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    console.error('❌ Firestore status sync failed:', err.message);
  }
}

/**
 * Called when a new draw is created by admin or cron.
 * Creates the Firestore document so the frontend can listen to it immediately.
 */
async function createDrawInFirestore(drawId, drawData) {
  try {
    await db.collection('draws').doc(drawId).set({
      status: 'open',
      scheduledAt: drawData.scheduled_at,
      gameId: drawData.game_id,
      timeSlot: drawData.time_slot || null,
      result: null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Firestore draw create failed:', err.message);
  }
}

module.exports = {
  syncResultToFirestore,
  syncDrawStatusToFirestore,
  createDrawInFirestore,
};
