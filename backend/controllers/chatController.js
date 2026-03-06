const { db } = require('../config/firebase');

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
            timestamp: new Date().toISOString(),
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
            lastUpdate: message.timestamp,
            participants
        }, { merge: true });

        res.status(201).json(message);
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

        // Manual sorting to avoid composite index requirements
        conversations.sort((a, b) => {
            const timeA = new Date(a.lastUpdate || 0).getTime();
            const timeB = new Date(b.lastUpdate || 0).getTime();
            return timeB - timeA;
        });

        res.status(200).json(conversations);
    } catch (error) {
        console.error('getConversations Error:', error);
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
};

module.exports = { sendMessage, getConversations, getMessages };
