const { db } = require('../config/firebase');
const { sendPushNotification } = require('../utils/pushNotifications');

const getAdminTokens = async () => {
    const snapshot = await db.collection('users').where('role', '==', 'admin').get();
    return snapshot.docs.map(doc => doc.data().expoPushToken).filter(Boolean);
};

const getUserToken = async (uid) => {
    if (!uid) return null;
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? doc.data().expoPushToken : null;
};

const saveNotification = async (userId, title, body, type = 'general', entityId = null) => {
    try {
        await db.collection('notifications').add({
            userId,
            title,
            body,
            type,
            entityId,
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving notification:', error);
    }
};

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

        // --- PUSH NOTIFICATIONS & STORAGE ---
        try {
            const adminSnapshot = await db.collection('users').where('role', '==', 'admin').get();
            const adminTokens = adminSnapshot.docs.map(doc => doc.data().expoPushToken).filter(Boolean);
            const adminUids = adminSnapshot.docs.map(doc => doc.id);

            const title = 'New Booking!';
            const body = `${userName} just booked an appointment.`;

            if (adminTokens.length > 0) {
                await sendPushNotification(adminTokens, title, body, { appointmentId: docRef.id });
            }

            // Save for each admin
            for (const adminUid of adminUids) {
                await saveNotification(adminUid, title, body, 'booking_new', docRef.id);
            }

            if (barberId) {
                const barberToken = await getUserToken(barberId);
                const bTitle = 'New Booking Assigned!';
                const bBody = `You have a new booking from ${userName}.`;
                if (barberToken) {
                    await sendPushNotification(barberToken, bTitle, bBody, { appointmentId: docRef.id });
                }
                await saveNotification(barberId, bTitle, bBody, 'booking_assigned', docRef.id);
            }
        } catch (pushErr) {
            console.error('Push notification error:', pushErr);
        }
        // --------------------------

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
        const { status, paymentStatus, paymentMethod } = req.body;
        const uid = req.user.uid;

        // Fetch user doc to check role
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const role = userData?.role?.toLowerCase();

        // Fetch appointment to check barberId
        const apptDoc = await db.collection('appointments').doc(id).get();
        if (!apptDoc.exists) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        const apptData = apptDoc.data();

        // Security check: Barbers can only update their assigned appointments
        if (role === 'barber' && apptData.barberId !== uid) {
            return res.status(403).json({ error: 'Forbidden: You can only update your assigned appointments' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (paymentMethod) updateData.paymentMethod = paymentMethod;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        await db.collection('appointments').doc(id).update(updateData);

        // --- PUSH NOTIFICATIONS & STORAGE ---
        try {
            if (status === 'completed') {
                const clientToken = await getUserToken(apptData.userId);
                const title = 'Appointment Completed';
                const body = 'Thank you for your visit! Your appointment is now complete.';
                if (clientToken) {
                    await sendPushNotification(clientToken, title, body, { appointmentId: id });
                }
                await saveNotification(apptData.userId, title, body, 'booking_completed', id);
            }
        } catch (pushErr) {
            console.error('Push notification error:', pushErr);
        }
        // --------------------------

        res.status(200).json({ id, ...updateData });
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

        // --- PUSH NOTIFICATIONS & STORAGE ---
        try {
            const apptDoc = await db.collection('appointments').doc(id).get();
            const apptData = apptDoc.data();

            const barberToken = await getUserToken(barberId);
            const bTitle = 'New Assignment';
            const bBody = `You have been assigned to an appointment for ${apptData.userName || 'a client'}.`;
            if (barberToken) {
                await sendPushNotification(barberToken, bTitle, bBody, { appointmentId: id });
            }
            await saveNotification(barberId, bTitle, bBody, 'booking_assigned', id);

            const clientToken = await getUserToken(apptData.userId);
            const cTitle = 'Booking Update';
            const cBody = 'Your booking has been assigned to a barber.';
            if (clientToken) {
                await sendPushNotification(clientToken, cTitle, cBody, { appointmentId: id });
            }
            await saveNotification(apptData.userId, cTitle, cBody, 'booking_update', id);
        } catch (pushErr) {
            console.error('Push notification error:', pushErr);
        }
        // --------------------------

        res.status(200).json({ id, barberId, status: 'assigned' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const apptsSnapshot = await db.collection('appointments').get();
        const packagesSnapshot = await db.collection('packages').get();
        const stylesSnapshot = await db.collection('styles').get();
        const usersSnapshot = await db.collection('users').get();

        const appointments = apptsSnapshot.docs.map(doc => doc.data());

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
            averageTicketSize: completedOrPaid.length > 0 ? totalRevenue / completedOrPaid.length : 0,
            totalPackages: packagesSnapshot.size,
            totalStyles: stylesSnapshot.size,
            totalUsers: usersSnapshot.size
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getNotifications = async (req, res) => {
    try {
        const uid = req.user.uid;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Cleanup: Delete notifications older than 30 days
        // We filter by userId only to avoid needing a Firestore composite index for 'createdAt' inequality
        const userDocs = await db.collection('notifications')
            .where('userId', '==', uid)
            .get();

        if (!userDocs.empty) {
            const batch = db.batch();
            let hasDeletions = false;
            userDocs.docs.forEach(doc => {
                const data = doc.data();
                if (data.createdAt < thirtyDaysAgo) {
                    batch.delete(doc.ref);
                    hasDeletions = true;
                }
            });
            if (hasDeletions) await batch.commit();
        }

        // 2. Fetch remaining notifications
        // Again, filter by userId only to avoid index requirements
        const snapshot = await db.collection('notifications')
            .where('userId', '==', uid)
            .get();

        let notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort in-memory to avoid requiring a Firestore Compound Index
        notifications.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        // Return latest 50
        res.status(200).json(notifications.slice(0, 50));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('notifications').doc(id).update({ read: true });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const clearAllNotifications = async (req, res) => {
    try {
        const uid = req.user.uid;
        const snapshot = await db.collection('notifications')
            .where('userId', '==', uid)
            .get();

        if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }
        res.status(200).json({ message: 'Notifications cleared successfully.' });
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

const cancelAppointmentByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const uid = req.user.uid;

        const apptDoc = await db.collection('appointments').doc(id).get();
        if (!apptDoc.exists) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const apptData = apptDoc.data();
        if (apptData.userId !== uid) {
            return res.status(403).json({ error: 'Forbidden: You can only cancel your own appointments' });
        }

        await db.collection('appointments').doc(id).update({ status: 'cancelled' });

        // --- PUSH & DB NOTIFICATIONS ---
        try {
            const { notifyAdmins, notifyUser } = require('../utils/notificationHelper');
            const cancelTitle = 'Booking Cancelled';
            const clientName = apptData.userName || 'A client';
            const adminBody = `Appointment for ${clientName} was cancelled.`;
            
            await notifyAdmins(cancelTitle, adminBody, 'booking_cancelled', id);

            if (apptData.barberId) {
                const barberBody = `Your appointment with ${clientName} was cancelled.`;
                await notifyUser(apptData.barberId, cancelTitle, barberBody, 'booking_cancelled', id);
            }
        } catch (pushErr) {
            console.error('Notification error during cancellation:', pushErr);
        }
        // --------------------------

        res.status(200).json({ id, status: 'cancelled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createAppointment,
    getUserAppointments,
    getBarberAppointments,
    getAllAppointments,
    updateAppointmentStatus,
    getAnalytics,
    assignBarber,
    deleteAppointment,
    cancelAppointmentByUser,
    getNotifications,
    markNotificationRead,
    clearAllNotifications
};
