const {
    getPackages,
    getStyles,
    createPackage,
    updatePackage,
    deletePackage,
    rateStyle
} = require('../controllers/packageController');
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getPackages);
router.get('/styles', getStyles);
router.post('/styles', authenticate, authorizeAdmin, createStyle);
router.put('/styles/:id', authenticate, authorizeAdmin, updateStyle);
router.delete('/styles/:id', authenticate, authorizeAdmin, deleteStyle);
router.post('/styles/:id/rate', authenticate, rateStyle);

// Category Routes
router.get('/categories', getCategories);
router.post('/categories', authenticate, authorizeAdmin, createCategory);
router.put('/categories/:id', authenticate, authorizeAdmin, updateCategory);
router.delete('/categories/:id', authenticate, authorizeAdmin, deleteCategory);

// Admin Routes
router.post('/', authenticate, authorizeAdmin, createPackage);
router.put('/:id', authenticate, authorizeAdmin, updatePackage);
router.delete('/:id', authenticate, authorizeAdmin, deletePackage);

module.exports = router;
