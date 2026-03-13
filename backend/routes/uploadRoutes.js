const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../controllers/uploadController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// Configure multer to store files in memory as Buffers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Only admins can upload images for packages/styles
router.post('/', authenticate, authorizeAdmin, upload.single('image'), uploadImage);

// Anyone (including new users during signup) can upload a profile photo
router.post('/profile', upload.single('image'), uploadImage);

module.exports = router;
