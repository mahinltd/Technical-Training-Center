const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    methodName: { 
        type: String, 
        required: true, 
        enum: ['bKash', 'Nagad', 'Rocket', 'Bank'] 
    },
    number: { 
        type: String, 
        required: true 
    },
    accountType: { 
        type: String, 
        default: 'Personal' // or 'Agent'
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);