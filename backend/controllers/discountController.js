const { db } = require('../config/firebase');

const getDiscounts = async (req, res) => {
    try {
        const snapshot = await db.collection('discounts').get();
        const discounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(discounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createDiscount = async (req, res) => {
    try {
        const { code, percentage, description, active, expiryDate } = req.body;

        if (!code || !percentage) {
            return res.status(400).json({ error: 'Code and percentage are required' });
        }

        const docRef = await db.collection('discounts').add({
            code: code.toUpperCase(),
            percentage: Number(percentage),
            description: description || '',
            active: active !== undefined ? active : true,
            expiryDate: expiryDate || null,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: docRef.id, code, percentage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (data.code) data.code = data.code.toUpperCase();
        if (data.percentage) data.percentage = Number(data.percentage);

        await db.collection('discounts').doc(id).update({
            ...data,
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('discounts').doc(id).delete();
        res.status(200).json({ message: 'Discount deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount
};
