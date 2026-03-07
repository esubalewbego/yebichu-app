const { db } = require('../config/firebase');

const createAppointment = async (req, res) => {
    try {
        const {
            userId,
            barberId = null,
            date,
            time,
            packageId = null,
            styleId = null,
            status = 'pending',
            item = null,
            price = 0,
            userName = 'Customer',
            userEmail = '',
            tx_ref = null
        } = req.body;

        const appointment = {
            userId,
            barberId,
            date,
            time,
            packageId,
            styleId,
            userName,
            userEmail,
            item: item ? JSON.parse(JSON.stringify(item)) : null,
            price: price || item?.price || 0,
            status,
            tx_ref,
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection('appointments').add(appointment);
        res.status(201).json({ id: docRef.id, ...appointment });
    } catch (error) {
        console.error('---- CREATE APPOINTMENT ERROR ----');
        console.error('Body:', req.body);
        console.error('Error:', error);
        console.error('----------------------------------');
        res.status(500).json({ error: 'Failed to create appointment', details: error.message });
    }
};

const getUserAppointments = async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await db.collection('appointments').where('userId', '==', userId).get();
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getBarberAppointments = async (req, res) => {
    try {
        const { barberId } = req.params;
        const snapshot = await db.collection('appointments').where('barberId', '==', barberId).get();
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllAppointments = async (req, res) => {
    try {
        const snapshot = await db.collection('appointments').orderBy('date', 'desc').get();
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.collection('appointments').doc(id).update({ status });
        res.status(200).json({ id, status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const assignBarber = async (req, res) => {
    try {
        const { id } = req.params;
        const { barberId } = req.body;

        if (!barberId) {
            return res.status(400).json({ error: 'barberId is required' });
        }

        await db.collection('appointments').doc(id).update({
            barberId,
            status: 'assigned' // Auto-update status when a barber is assigned
        });

        res.status(200).json({ id, barberId, status: 'assigned' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const snapshot = await db.collection('appointments').get();
        const appointments = snapshot.docs.map(doc => doc.data());

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const completedOrPaid = appointments.filter(a => {
            const s = a.status?.toLowerCase();
            return s === 'completed' || s === 'paid';
        });

        const totalRevenue = completedOrPaid.reduce((sum, a) => sum + (Number(a.item?.price || a.price) || 0), 0);

        const monthlyRevenue = completedOrPaid
            .filter(a => {
                const apptDate = new Date(a.date || a.createdAt);
                return apptDate >= new Date(startOfMonth);
            })
            .reduce((sum, a) => sum + (Number(a.item?.price || a.price) || 0), 0);

        const stats = {
            totalAppointments: appointments.length,
            completed: appointments.filter(a => a.status?.toLowerCase() === 'completed').length,
            pending: appointments.filter(a => {
                const s = a.status?.toLowerCase();
                return s === 'pending' || s === 'assigned';
            }).length,
            cancelled: appointments.filter(a => a.status?.toLowerCase() === 'cancelled').length,
            totalRevenue: totalRevenue,
            monthlyRevenue: monthlyRevenue,
            averageTicketSize: completedOrPaid.length > 0 ? totalRevenue / completedOrPaid.length : 0
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('appointments').doc(id).delete();
        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createAppointment, getUserAppointments, getBarberAppointments, getAllAppointments, updateAppointmentStatus, getAnalytics, assignBarber, deleteAppointment };
