const { db, admin } = require('../config/firebase');

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

        // Create a unique conversation ID (alphabetical order of UIDs)
        const participants = [senderId, receiverId].sort();
        const conversationId = participants.join('_');

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
        const conversationWithDetails = await Promise.all(conversations.map(async (convo) => {
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
