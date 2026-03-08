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
        const role = userData?.role?.toLowerCase() || req.user.role?.toLowerCase();

        console.log(`[AUTH DEBUG] UID: ${req.user.uid}, Exists: ${userDoc.exists}, Role: ${role}`);

        if (role === 'admin') {
            next();
        } else {
            console.warn(`[AUTH DENIED] User ${req.user.uid} tried to access admin route. Role: ${role}`);
            res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
    } catch (error) {
        console.error('[AUTH ERROR]:', error);
        res.status(500).json({ error: 'Authorization error' });
    }
};

const authorizeBarberOrAdmin = async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        const userData = userDoc.data();
        const role = (userData?.role || req.user.role || '').trim().toLowerCase();

        console.log(`[AUTH DEBUG Barber/Admin] UID: ${req.user.uid}, Exists: ${userDoc.exists}, Role: '${role}'`);

        if (role === 'admin' || role === 'barber') {
            next();
        } else {
            console.warn(`[AUTH DENIED Barber/Admin] User ${req.user.uid} tried to access route. Role: '${role}'`);
            res.status(403).json({ error: 'Forbidden: Admin or Barber access required' });
        }
    } catch (error) {
        console.error('[AUTH ERROR Barber/Admin]:', error);
        res.status(500).json({ error: 'Authorization error' });
    }
};

module.exports = { authenticate, authorizeAdmin, authorizeBarberOrAdmin };
