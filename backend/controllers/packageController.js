const { db } = require('../config/firebase');

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
        const styles = stylesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(styles);
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

module.exports = { getPackages, getStyles, createPackage, updatePackage, deletePackage };
