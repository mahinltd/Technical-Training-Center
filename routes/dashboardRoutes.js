const express = require('express');
const router = express.Router();

// ✅ ১. getAdminStats এখানে ইমপোর্ট করা হলো
const { 
    getStudentDashboard, 
    getReceiptData, 
    getAdminStats 
} = require('../controllers/dashboardController');

// ✅ ২. 'admin' মিডলওয়্যারটি এখানে অবশ্যই ইমপোর্ট করতে হবে (আগে এটি মিসিং ছিল)
const { protect, admin } = require('../middleware/authMiddleware');

// Student Routes
router.get('/student', protect, getStudentDashboard);
router.get('/receipt/:paymentId', protect, getReceiptData);

// Admin Route
router.get('/admin/stats', protect, admin, getAdminStats);

module.exports = router;
