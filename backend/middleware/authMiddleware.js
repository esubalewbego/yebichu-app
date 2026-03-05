const { auth, db } = require('../config/firebase');

const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

const authorizeAdmin = async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        const userData = userDoc.data();

        if (userData && (userData.role === 'admin' || req.user.role === 'admin')) {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Authorization error' });
    }
};

module.exports = { authenticate, authorizeAdmin };
