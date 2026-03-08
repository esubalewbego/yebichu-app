const express = require('express');
const multer = require('multer');
const { signup, getUserProfile, updateUserProfile, getBarbers, getAllUsers, updateUserRole, deleteUser, getAdminInfo, toggleWishlist, loginWithIdentifier, updatePushToken } = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/signup', upload.single('profileImage'), signup);
router.post('/login-identifier', loginWithIdentifier);
router.get('/admin-info', authenticate, getAdminInfo);
router.get('/barbers', authenticate, getBarbers);
router.get('/profile/:userId', authenticate, getUserProfile);
router.put('/profile/:userId', authenticate, upload.single('profileImage'), updateUserProfile);
router.patch('/profile/:uid/push-token', authenticate, updatePushToken);

// Admin routes for user management
router.get('/users', authenticate, authorizeAdmin, getAllUsers);
router.patch('/users/:id/role', authenticate, authorizeAdmin, updateUserRole);
router.post('/wishlist/toggle', authenticate, toggleWishlist);

module.exports = router;
