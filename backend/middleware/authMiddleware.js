const { auth, db } = require('../config/firebase');

const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    try {
        // Development/Mock Bypass
        if (token.startsWith('MOCK_TOKEN_')) {
            const role = token.split('_')[2].toLowerCase();
            req.user = {
                uid: 'mock_' + role + '_123',
                role: role,
                email: role + '@test.com'
            };
            return next();
        }

        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

const authorizeAdmin = async (req, res, next) => {
    try {
        // Mock users are already validated in authenticate()
        if (req.user.uid.startsWith('mock_')) {
            if (req.user.role === 'admin') return next();
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

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
