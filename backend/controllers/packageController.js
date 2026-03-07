const { db, admin } = require('../config/firebase');

const getPackages = async (req, res) => {
    try {
        const packagesSnapshot = await db.collection('packages').get();
        const packages = packagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(packages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getStyles = async (req, res) => {
    try {
        const stylesSnapshot = await db.collection('styles').get();
        const styles = await Promise.all(stylesSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const ratingsSnapshot = await db.collection('styles').doc(doc.id).collection('ratings').get();
            const ratings = ratingsSnapshot.docs.map(d => d.data().rating);

            const ratingCount = ratings.length;
            const avgRating = ratingCount > 0
                ? (ratings.reduce((a, b) => a + b, 0) / ratingCount).toFixed(1)
                : 0;

            return {
                id: doc.id,
                ...data,
                avgRating: Number(avgRating),
                ratingCount
            };
        }));
        res.status(200).json(styles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const rateStyle = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        const userId = req.user.uid;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid rating. Must be between 1 and 5.' });
        }

        // Store rating in a sub-collection
        await db.collection('styles').doc(id).collection('ratings').doc(userId).set({
            rating,
            userId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'Rating submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createPackage = async (req, res) => {
    try {
        const data = req.body;
        const docRef = await db.collection('packages').add({
            ...data,
            category: 'package',
            createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        await db.collection('packages').doc(id).update(data);
        res.status(200).json({ id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePackage = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('packages').doc(id).delete();
        res.status(200).json({ message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createStyle = async (req, res) => {
    try {
        const data = req.body;
        const docRef = await db.collection('styles').add({
            ...data,
            createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStyle = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        await db.collection('styles').doc(id).update(data);
        res.status(200).json({ id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteStyle = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('styles').doc(id).delete();
        res.status(200).json({ message: 'Style deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPackages,
    getStyles,
    createPackage,
    updatePackage,
    deletePackage,
    rateStyle,
    createStyle,
    updateStyle,
    deleteStyle
};
