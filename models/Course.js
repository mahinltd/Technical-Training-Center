const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    titleBn: { type: String, default: "" }, 
    description: { type: String },
    descriptionBn: { type: String, default: "" },
    
    // New Field: Course Type
    type: { 
        type: String, 
        enum: ['Govt', 'Private'], 
        default: 'Private',
        required: true 
    },

    fee: { type: Number, required: true },
    transactionFee: { type: Number, default: 30 },
    duration: { type: String }, 
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);