const { db } = require('../config/firebase');
const { sendPushNotification } = require('./pushNotifications');

/**
 * Saves a notification to Firestore and sends a push notification.
 * @param {string} userId - ID of the user to receive the notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} type - Notification type (e.g., 'booking_new', 'chat_message', 'new_service')
 * @param {string} entityId - Optional ID of the related entity (e.g., appointmentId, messageId)
 */
const notifyUser = async (userId, title, body, type = 'general', entityId = null) => {
    try {
        if (!userId) return;

        // 1. Save to Firestore
        await db.collection('notifications').add({
            userId,
            title,
            body,
            type,
            entityId,
            read: false,
            createdAt: new Date().toISOString()
        });

        // 2. Fetch User Token
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const token = userDoc.data().expoPushToken;
            if (token) {
                // 3. Send Push Notification
                await sendPushNotification(token, title, body, { type, entityId });
            }
        }
    } catch (error) {
        console.error('Error in notifyUser helper:', error);
    }
};

/**
 * Notifies all admins.
 */
const notifyAdmins = async (title, body, type = 'general', entityId = null) => {
    try {
        const adminSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        for (const doc of adminSnapshot.docs) {
            await notifyUser(doc.id, title, body, type, entityId);
        }
    } catch (error) {
        console.error('Error in notifyAdmins helper:', error);
    }
};

/**
 * Broadcasts a notification to all users.
 */
const broadcastToAllUsers = async (title, body, type = 'general', entityId = null) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        for (const doc of usersSnapshot.docs) {
            await notifyUser(doc.id, title, body, type, entityId);
        }
    } catch (error) {
        console.error('Error in broadcastToAllUsers helper:', error);
    }
};

module.exports = {
    notifyUser,
    notifyAdmins,
    broadcastToAllUsers
};
