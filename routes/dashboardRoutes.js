const express = require('express');
const router = express.Router();
const { getStudentDashboard, getReceiptData } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// All dashboard routes are protected
router.get('/student', protect, getStudentDashboard);
router.get('/receipt/:paymentId', protect, getReceiptData);

module.exports = router;