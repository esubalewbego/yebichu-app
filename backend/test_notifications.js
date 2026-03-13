const { db } = require('./config/firebase');

async function test() {
    try {
        const snapshot = await db.collection('notifications').get();
        const tokens = snapshot.docs.map(doc => doc.data());
        console.log(`Found ${tokens.length} notifications.`);
        console.log(tokens);
    } catch(err) {
        console.log(err);
    }
}
test();
