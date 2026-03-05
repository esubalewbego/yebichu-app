const express = require('express');
const { getPackages, getStyles, createPackage, updatePackage, deletePackage } = require('../controllers/packageController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getPackages);
router.get('/styles', getStyles);

// Admin Routes
router.post('/', authenticate, authorizeAdmin, createPackage);
router.put('/:id', authenticate, authorizeAdmin, updatePackage);
router.delete('/:id', authenticate, authorizeAdmin, deletePackage);

module.exports = router;
