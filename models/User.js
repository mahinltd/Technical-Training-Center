const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    studentId: { type: String, unique: true }, 
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['student', 'admin'], 
        default: 'student' 
    },
    avatar: { type: String, default: "" },
    
    // --- Verification Fields ---
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },

    // --- Reset Password Fields ---
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);