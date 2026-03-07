const express = require('express');
const { signup, getUserProfile, getBarbers, getAllUsers, updateUserRole, deleteUser, getAdminInfo, toggleWishlist } = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.get('/admin-info', authenticate, getAdminInfo);
router.get('/barbers', authenticate, getBarbers);
router.get('/profile/:userId', authenticate, getUserProfile);

// Admin routes for user management
router.get('/users', authenticate, authorizeAdmin, getAllUsers);
router.patch('/users/:id/role', authenticate, authorizeAdmin, updateUserRole);
router.post('/wishlist/toggle', authenticate, toggleWishlist);

module.exports = router;
