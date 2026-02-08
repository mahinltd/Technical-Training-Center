const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    // --- New Fields from Physical Form ---
    session: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    religion: { type: String, required: true },
    maritalStatus: { type: String, default: 'Single' },
    nidOrBirthCert: { type: String, required: true },
    presentAddress: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    
    // Images
    photoUrl: { type: String, required: true }, 
    signatureUrl: { type: String, required: true }, 

    rollNo: { type: String }, 
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    paymentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Payment' 
    }
}, { timestamps: true });

// Prevent duplicate admission for same course by same user
admissionSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Admission', admissionSchema);
