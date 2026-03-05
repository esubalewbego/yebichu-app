const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let db, auth;

try {
    const serviceAccount = require('./firebase-service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    auth = admin.auth();
    console.log('✅ Firebase initialized successfully.');
} catch (error) {
    console.warn('⚠️ Firebase initialization failed (Invalid Credentials). Switching to MOCK MODE.');
    // Mock implementations so the server can still run
    db = {
        collection: (name) => ({
            get: async () => ({ docs: [] }),
            add: async (data) => ({ id: 'mock-id-' + Math.random().toString(36).substr(2, 9) }),
            where: () => ({ get: async () => ({ docs: [] }) }),
        })
    };
    auth = {
        getUser: async () => ({ uid: 'mock-user-id' }),
    };
}

module.exports = { admin, db, auth };
