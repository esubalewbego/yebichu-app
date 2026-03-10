const { db, admin } = require('../config/firebase');
const { notifyUser } = require('../utils/notificationHelper');

const sendMessage = async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        const senderId = req.user.uid;

        if (!receiverId || !text) {
            return res.status(400).json({ error: 'receiverId and text are required' });
        }

        const message = {
            senderId,
            receiverId,
            text,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        };

        const participants = [senderId, receiverId].sort();
        const conversationId = participants.join('_');

        // Restriction: Non-admins can only send messages to admins
        if (req.user.role !== 'admin') {
            const receiverDoc = await db.collection('users').doc(receiverId).get();
            if (!receiverDoc.exists || receiverDoc.data().role !== 'admin') {
                return res.status(403).json({ error: 'You can only chat with administrator support.' });
            }
        }

        await db.collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .add(message);

        // Update conversation metadata
        await db.collection('conversations').doc(conversationId).set({
            lastMessage: text,
            lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
            participants
        }, { merge: true });

        res.status(201).json({ ...message, timestamp: new Date().toISOString() });

        // Notify Receiver
        try {
            const senderDoc = await db.collection('users').doc(senderId).get();
            const senderName = senderDoc.exists ? (senderDoc.data().fullName || senderDoc.data().displayName || 'someone') : 'someone';

            notifyUser(
                receiverId,
                'New Message',
                `${senderName} sent you a message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                'chat_message',
                conversationId
            );
        } catch (notifierErr) {
            console.error('Failed to send chat notification:', notifierErr);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getConversations = async (req, res) => {
    try {
        const uid = req.user.uid;
        // Fetch conversations where user is a participant
        const snapshot = await db.collection('conversations')
            .where('participants', 'array-contains', uid)
            .get();

        const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Resolve participant identities
        let conversationWithDetails = await Promise.all(conversations.map(async (convo) => {
            const otherUid = convo.participants.find(p => p !== uid);
            if (!otherUid) return { ...convo, otherParticipant: { name: 'Chat', email: '' } };

            try {
                const userDoc = await db.collection('users').doc(otherUid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    return {
                        ...convo,
                        otherParticipant: {
                            name: userData.role === 'admin' ? 'Admin Support' : (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : (userData.displayName || userData.email?.split('@')[0] || 'User')),
                            email: userData.email || '',
                            role: userData.role
                        }
                    };
                }
            } catch (err) {
                console.error(`Failed to fetch user ${otherUid}:`, err);
            }
            return { ...convo, otherParticipant: { name: 'User', email: otherUid } };
        }));

        // Restriction: Non-admins can only see conversations with an admin
        if (req.user.role !== 'admin') {
            conversationWithDetails = conversationWithDetails.filter(c => c.otherParticipant && c.otherParticipant.role === 'admin');
        }

        // Manual sorting to avoid composite index requirements
        conversationWithDetails.sort((a, b) => {
            const getMillis = (val) => {
                if (!val) return 0;
                if (typeof val.toMillis === 'function') return val.toMillis();
                if (val._seconds) return val._seconds * 1000;
                const d = new Date(val);
                return isNaN(d.getTime()) ? 0 : d.getTime();
            };
            return getMillis(b.lastUpdate) - getMillis(a.lastUpdate);
        });

        res.status(200).json(conversationWithDetails);
    } catch (error) {
        console.error('getConversations Error Details:', error);
        res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const snapshot = await db.collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();

        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(messages);
    } catch (error) {
        console.error('getMessages Error:', error);
        res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }
};

module.exports = { sendMessage, getConversations, getMessages };
