const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    titleBn: { type: String, default: "" },
    type: { 
        type: String, 
        // ✅ আপডেটেড লিস্ট: সব ধরনের ফাইল সাপোর্ট করবে
        enum: ['PDF', 'Doc', 'Software', 'AI', 'PSD', 'Template', 'Other'], 
        required: true  
    },
    logoKey: {
        type: String,
        enum: ['photoshop', 'illustrator', 'msword', 'excel', 'powerpoint', 'autocad', 'office', 'graphics', 'cv', 'template', 'software', 'generic'],
        default: 'generic'
    },
    price: { type: Number, required: true },
    transactionFee: { type: Number, default: 30 },
    thumbnailUrl: { type: String, required: true }, // Preview Image
    fileUrl: { type: String, required: true }, // Secure Download Link
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
