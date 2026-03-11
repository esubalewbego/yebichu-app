const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let db, auth;

try {
    let serviceAccount;

    if (process.env.FIREBASE_PRIVATE_KEY) {
        // Prepare service account from environment variables (Cloud Deployment)
        serviceAccount = {
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
        };
        console.log('🌐 Using Firebase Environment Variables for initialization.');
    } else {
        // Fallback to local JSON file (Local Development)
        serviceAccount = require('./firebase-service-account.json');
        console.log('📁 Using local firebase-service-account.json.');
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    auth = admin.auth();
    console.log('✅ Firebase initialized successfully.');
} catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error.message);
    console.log('🔄 Switching to MOCK MODE for development.');
    // Mock implementations so the server can still run
    db = {
        collection: (name) => ({
            get: async () => ({ docs: [] }),
            add: async (data) => ({ id: 'mock-id-' + Math.random().toString(36).substr(2, 9) }),
            where: () => ({ get: async () => ({ docs: [] }), where: () => ({ get: async () => ({ docs: [] }) }) }),
            doc: (id) => ({
                get: async () => ({ exists: false }),
                set: async () => ({}),
                update: async () => ({}),
                delete: async () => ({}),
            })
        }),
        batch: () => ({
            delete: () => { },
            commit: async () => { }
        }),
        settings: () => { }
    };
    auth = {
        getUser: async () => ({ uid: 'mock-user-id' }),
        createUser: async () => ({ uid: 'mock-uid' }),
        deleteUser: async () => { },
        updateUser: async () => { },
    };
}

module.exports = { admin, db, auth };
