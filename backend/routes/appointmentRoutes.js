const express = require('express');
const { createAppointment, getUserAppointments, getBarberAppointments, getAllAppointments, updateAppointmentStatus, getAnalytics, assignBarber, deleteAppointment, cancelAppointmentByUser, getNotifications, markNotificationRead, clearAllNotifications } = require('../controllers/appointmentController');
const { authenticate, authorizeAdmin, authorizeBarberOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, createAppointment);
router.delete('/notifications/clear', authenticate, clearAllNotifications);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);
router.get('/user/:userId', authenticate, getUserAppointments);
router.patch('/user/:id/cancel', authenticate, cancelAppointmentByUser);
router.get('/barber/:barberId', authenticate, getBarberAppointments);

// Admin / Shared Routes
router.patch('/admin/:id/status', authenticate, authorizeBarberOrAdmin, updateAppointmentStatus);

// Admin Only Routes
router.get('/admin/all', authenticate, authorizeAdmin, getAllAppointments);
router.get('/admin/analytics', authenticate, authorizeAdmin, getAnalytics);
router.put('/admin/:id/assign', authenticate, authorizeAdmin, assignBarber);
router.delete('/admin/:id', authenticate, authorizeAdmin, deleteAppointment);

module.exports = router;
