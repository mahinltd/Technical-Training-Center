const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// 1. Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Multer (Use Memory Storage)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

// Helper: Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Images Only! (jpeg, jpg, png, webp)'));
    }
}

// @desc    Upload Image to Cloudinary
// @route   POST /api/upload
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Convert buffer to base64 string for Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'tctc-uploads', // Folder name in Cloudinary
            resource_type: 'auto',
        });

        res.json({
            message: 'Image uploaded successfully',
            url: result.secure_url, // This is the link we will save in MongoDB
            public_id: result.public_id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};

// Route
router.post('/', upload.single('image'), uploadImage);

module.exports = router;