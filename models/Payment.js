const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Updated enum to include 'admission'
    sourceType: { 
        type: String, 
        enum: ['admission', 'course', 'product'], 
        required: true 
    },
    
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Admission ID or Product ID
    
    amount: { type: Number, required: true },
    transactionFee: { type: Number, default: 30 },
    totalAmount: { type: Number, required: true },
    
    paymentMethod: { type: String, enum: ['bkash', 'nagad', 'rocket', 'offline'], required: true },
    senderMobile: { type: String },
    transactionId: { type: String }, // User provided
    
    status: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'], 
        default: 'pending' 
    },
    receiptNo: { type: String }, // Generated after verify
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);