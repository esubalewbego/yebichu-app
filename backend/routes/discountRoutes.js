const express = require('express');
const { getDiscounts, createDiscount, updateDiscount, deleteDiscount } = require('../controllers/discountController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getDiscounts);
router.post('/', authenticate, authorizeAdmin, createDiscount);
router.put('/:id', authenticate, authorizeAdmin, updateDiscount);
router.delete('/:id', authenticate, authorizeAdmin, deleteDiscount);

module.exports = router;
