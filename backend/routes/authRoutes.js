const express = require('express');
const { signup, getUserProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.get('/profile/:userId', authenticate, getUserProfile);

module.exports = router;
