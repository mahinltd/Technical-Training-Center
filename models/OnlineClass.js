const mongoose = require('mongoose');

const onlineClassSchema = new mongoose.Schema({
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    title: { type: String, required: true }, // e.g. "Class 1: Introduction"
    meetingLink: { type: String, required: true }, // Zoom/Google Meet Link
    scheduledAt: { type: Date }, // Optional: When the class starts
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('OnlineClass', onlineClassSchema);