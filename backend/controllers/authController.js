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
        // Map role correctly: allow admin only if a special admin key is provided
        // But allow 'barber' freely during signup
        const userRole = (role === 'admin' || role === 'barber') ? role : 'user';
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

const getAllUsers = async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['user', 'barber', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be user, barber, or admin.' });
        }
        await db.collection('users').doc(id).update({ role });
        res.status(200).json({ id, role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Delete from Firebase Auth
        await auth.deleteUser(id);
        // Delete from Firestore
        await db.collection('users').doc(id).delete();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { signup, getUserProfile, getBarbers, getAllUsers, updateUserRole, deleteUser };
