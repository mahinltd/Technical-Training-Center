const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    getProductsAdmin,
    createProduct,
    updateProduct,
    downloadProduct, 
    deleteProduct 
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getProducts) // Public view
    .post(protect, admin, createProduct); // Admin create

router.route('/admin')
    .get(protect, admin, getProductsAdmin);

router.get('/download/:id', protect, downloadProduct); // Secure download

router.route('/:id')
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct); // Admin delete

module.exports = router;
