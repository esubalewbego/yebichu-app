const express = require('express');
const { signup, getUserProfile, getBarbers, getAllUsers, updateUserRole, deleteUser } = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.get('/profile/:userId', authenticate, getUserProfile);
router.get('/barbers', authenticate, getBarbers);

// Admin routes for user management
router.get('/users', authenticate, authorizeAdmin, getAllUsers);
router.patch('/users/:id/role', authenticate, authorizeAdmin, updateUserRole);
router.delete('/users/:id', authenticate, authorizeAdmin, deleteUser);

module.exports = router;
