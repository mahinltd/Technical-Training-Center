const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    createProduct, 
    downloadProduct, 
    deleteProduct 
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getProducts) // Public view
    .post(protect, admin, createProduct); // Admin create

router.route('/:id')
    .delete(protect, admin, deleteProduct); // Admin delete

router.get('/download/:id', protect, downloadProduct); // Secure download

module.exports = router;