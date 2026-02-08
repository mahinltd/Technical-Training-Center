const Product = require('../models/Product');
const Payment = require('../models/Payment');

// @desc    Get all active products
// @route   GET /api/products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true });
        // Hide fileUrl from public view
        const publicProducts = products.map(p => ({
            _id: p._id,
            title: p.title,
            titleBn: p.titleBn,
            type: p.type,
            price: p.price,
            thumbnailUrl: p.thumbnailUrl,
            description: p.description
        }));
        res.json(publicProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Product (Admin)
// @route   POST /api/products
const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        const savedProduct = await product.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Secure Download (Check if user paid)
// @route   GET /api/products/download/:id
const downloadProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;

        // 1. Check if Admin
        if (req.user.role === 'admin') {
            const product = await Product.findById(productId);
            return res.json({ fileUrl: product.fileUrl });
        }

        // 2. Check if User Paid & Verified
        const payment = await Payment.findOne({
            user: userId,
            sourceType: 'product',
            sourceId: productId,
            status: 'verified'
        });

        if (payment) {
            const product = await Product.findById(productId);
            res.json({ fileUrl: product.fileUrl });
        } else {
            res.status(403).json({ message: 'Purchase not verified or found' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Product (Admin)
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getProducts, createProduct, downloadProduct, deleteProduct };