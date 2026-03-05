const express = require('express');
const { createAppointment, getUserAppointments, getBarberAppointments, getAllAppointments, updateAppointmentStatus, getAnalytics, assignBarber } = require('../controllers/appointmentController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, createAppointment);
router.get('/user/:userId', authenticate, getUserAppointments);
router.get('/barber/:barberId', authenticate, getBarberAppointments);

// Admin Routes
router.get('/admin/all', authenticate, authorizeAdmin, getAllAppointments);
router.get('/admin/analytics', authenticate, authorizeAdmin, getAnalytics);
router.patch('/admin/:id/status', authenticate, authorizeAdmin, updateAppointmentStatus);
router.put('/admin/:id/assign', authenticate, authorizeAdmin, assignBarber);

module.exports = router;
