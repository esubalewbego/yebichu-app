const { auth, db } = require('../config/firebase');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { notifyAdmins } = require('../utils/notificationHelper');

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

        // Handle optional profile image upload
        let profileImageUrl = null;
        if (req.file) {
            try {
                profileImageUrl = await uploadToCloudinary(req.file.buffer, 'yebichu_profiles');
            } catch (imgErr) {
                console.error('Failed to upload profile image during signup:', imgErr);
            }
        }

        // Save additional profile info in Firestore
        const userRole = 'user';
        await db.collection('users').doc(userRecord.uid).set({
            fullName,
            username: username.toLowerCase(),
            email,
            role: userRole,
            profileImageUrl,
            wishlist: [],
            createdAt: new Date().toISOString(),
        });

        res.status(201).json({ uid: userRecord.uid, email, role: userRole, profileImageUrl });

        // Notify Admins of new registration
        notifyAdmins(
            'New User Registration',
            `${fullName} (@${username}) has just joined Yebichu.`,
            'new_user',
            userRecord.uid
        );
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

const updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullName, username, bio, phone } = req.body;

        // Security Check: Users can only update their own profile unless they are an admin
        if (req.user.uid !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
        }

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (bio !== undefined) updateData.bio = bio;
        if (phone !== undefined) updateData.phone = phone;

        // Ensure username is unique if changing
        if (username) {
            const usernameLower = username.toLowerCase();
            const usernameCheck = await db.collection('users').where('username', '==', usernameLower).get();
            if (!usernameCheck.empty) {
                const existingDoc = usernameCheck.docs[0];
                if (existingDoc.id !== userId) {
                    return res.status(400).json({ error: 'Username already taken' });
                }
            }
            updateData.username = usernameLower;
        }

        // Handle Image Upload
        if (req.file) {
            try {
                updateData.profileImageUrl = await uploadToCloudinary(req.file.buffer, 'yebichu_profiles');
            } catch (imgErr) {
                console.error('Failed to upload profile image update:', imgErr);
                return res.status(500).json({ error: 'Failed to upload image' });
            }
        }

        if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = new Date().toISOString();
            await db.collection('users').doc(userId).update(updateData);
        }

        res.status(200).json({ id: userId, ...updateData, message: 'Profile updated successfully' });
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

const updatePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        if (req.user.uid !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        await auth.updateUser(userId, { password: newPassword });
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkEmailExists = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        res.status(200).json({ exists: !snapshot.empty });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    signup,
    getUserProfile,
    updateUserProfile,
    getBarbers,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getAdminInfo,
    toggleWishlist,
    loginWithIdentifier,
    updatePushToken,
    updatePassword,
    checkEmailExists
};
