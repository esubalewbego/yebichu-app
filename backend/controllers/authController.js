const { auth, db } = require('../config/firebase');

const signup = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        // Create Firebase User
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
        });

        // Save additional profile info in Firestore
        const userRole = role === 'admin' ? 'admin' : 'user'; // Default to user
        await db.collection('users').doc(userRecord.uid).set({
            firstName,
            lastName,
            email,
            role: userRole,
            createdAt: new Date().toISOString(),
        });

        res.status(201).json({ uid: userRecord.uid, email, role: userRole });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.params.userId).get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const getBarbers = async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('role', '==', 'barber').get();
        const barbers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(barbers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { signup, getUserProfile, getBarbers };
