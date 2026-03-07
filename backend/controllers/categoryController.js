const { db } = require('../config/firebase');

const getCategories = async (req, res) => {
    try {
        const snapshot = await db.collection('categories').orderBy('name').get();
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, icon } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const docRef = await db.collection('categories').add({
            name,
            icon: icon || 'Scissors',
            createdAt: new Date().toISOString()
        });
        res.status(201).json({ id: docRef.id, name, icon });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        await db.collection('categories').doc(id).update(data);
        res.status(200).json({ id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('categories').doc(id).delete();
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
