const Product = require('../models/Product');
const Payment = require('../models/Payment');

const inferLogoKey = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes('photoshop') || t.includes('psd')) return 'photoshop';
    if (t.includes('illustrator') || t.includes('ai')) return 'illustrator';
    if (t.includes('ms word') || t.includes('word')) return 'msword';
    if (t.includes('excel')) return 'excel';
    if (t.includes('powerpoint') || t.includes('ppt')) return 'powerpoint';
    if (t.includes('autocad')) return 'autocad';
    if (t.includes('office')) return 'office';
    if (t.includes('cv') || t.includes('resume')) return 'cv';
    if (t.includes('template')) return 'template';
    if (t.includes('software')) return 'software';
    if (t.includes('graphics')) return 'graphics';
    return 'generic';
};

const ensureLogoKey = (payload = {}) => {
    if (!payload.logoKey || payload.logoKey === 'generic') {
        payload.logoKey = inferLogoKey(payload.title || payload.description || "");
    }
    return payload;
};

const sanitizeProduct = (product, options = {}) => {
    const { includeFile = false } = options;
    const base = {
        _id: product._id,
        title: product.title,
        titleBn: product.titleBn,
        type: product.type,
        logoKey: product.logoKey,
        price: product.price,
        transactionFee: product.transactionFee,
        thumbnailUrl: product.thumbnailUrl,
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
    };

    if (includeFile) {
        base.fileUrl = product.fileUrl;
    }

    return base;
};

// @desc    Get all active products
// @route   GET /api/products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true });
        res.json(products.map((p) => sanitizeProduct(p)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all products for admin
// @route   GET /api/products/admin
const getProductsAdmin = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products.map((p) => sanitizeProduct(p, { includeFile: true })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Product (Admin)
// @route   POST /api/products
const createProduct = async (req, res) => {
    try {
        const payload = ensureLogoKey({ ...req.body });
        const product = new Product(payload);
        const savedProduct = await product.save();
        res.status(201).json(sanitizeProduct(savedProduct, { includeFile: true }));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update Product (Admin)
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const payload = ensureLogoKey({ ...req.body });
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, payload, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(sanitizeProduct(updatedProduct, { includeFile: true }));
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

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // 1. Check if Admin
        if (req.user.role === 'admin') {
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

module.exports = { 
    getProducts, 
    getProductsAdmin,
    createProduct, 
    updateProduct,
    downloadProduct, 
    deleteProduct 
};
