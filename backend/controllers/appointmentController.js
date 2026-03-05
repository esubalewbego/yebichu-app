const { db } = require('../config/firebase');

const createAppointment = async (req, res) => {
    try {
        const { userId, barberId, date, time, packageId, styleId, status } = req.body;

        const appointment = {
            userId,
            barberId,
            date,
            time,
            packageId,
            styleId,
            status: status || 'pending',
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection('appointments').add(appointment);
        res.status(201).json({ id: docRef.id, ...appointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

        const totalRevenue = appointments
            .filter(a => a.status === 'completed' || a.status === 'paid')
            .reduce((sum, a) => sum + (Number(a.item?.price) || 0), 0);

        const stats = {
            totalAppointments: appointments.length,
            completed: appointments.filter(a => a.status === 'completed').length,
            pending: appointments.filter(a => a.status === 'pending').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length,
            totalRevenue: totalRevenue,
            monthlyRevenue: totalRevenue * 0.8, // Simplified mock for demo
            averageTicketSize: appointments.length > 0 ? totalRevenue / appointments.length : 0
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createAppointment, getUserAppointments, getBarberAppointments, getAllAppointments, updateAppointmentStatus, getAnalytics, assignBarber };
