const { auth, db } = require('../config/firebase');

const signup = async (req, res) => {
    try {
        const { email, password, fullName, username } = req.body;

        if (!fullName || !username) {
            return res.status(400).json({ error: 'Full Name and Username are required' });
        }

        // Check if username already exists
        const usernameCheck = await db.collection('users').where('username', '==', username).get();
        if (!usernameCheck.empty) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Create Firebase User
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: fullName,
        });

        // Save additional profile info in Firestore
        const userRole = 'user';
        await db.collection('users').doc(userRecord.uid).set({
            fullName,
            username: username.toLowerCase(),
            email,
            role: userRole,
            wishlist: [],
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

const updatePushToken = async (req, res) => {
    try {
        const { uid } = req.params;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        await db.collection('users').doc(uid).update({
            expoPushToken: token,
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ message: 'Push token updated successfully' });
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

const getAdminInfo = async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: 'Admin not found' });

        const adminDoc = snapshot.docs[0];
        res.status(200).json({ uid: adminDoc.id, ...adminDoc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const { id } = req.body; // Package or Style ID
        const uid = req.user.uid;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        const userData = userDoc.data();
        let wishlist = userData.wishlist || [];

        if (wishlist.includes(id)) {
            wishlist = wishlist.filter(item => item !== id);
        } else {
            wishlist.push(id);
        }

        await userRef.update({ wishlist });
        res.status(200).json({ wishlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const loginWithIdentifier = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({ error: 'Identifier (email or username) is required' });
        }

        let email = identifier;

        // If identifier is not an email, look up by username
        if (!identifier.includes('@')) {
            const snapshot = await db.collection('users').where('username', '==', identifier.toLowerCase()).limit(1).get();
            if (snapshot.empty) {
                return res.status(404).json({ error: 'User not found with this username' });
            }
            email = snapshot.docs[0].data().email;
        }

        res.status(200).json({ email });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { signup, getUserProfile, getBarbers, getAllUsers, updateUserRole, deleteUser, getAdminInfo, toggleWishlist, loginWithIdentifier, updatePushToken };
