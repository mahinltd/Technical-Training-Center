const express = require('express');
const router = express.Router();
const {
    createPayment,
    verifyPayment,
    rejectPayment,
    getAllPayments,
    deletePayment,
    // Import new controllers
    getPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public Route to see numbers
router.get('/methods', getPaymentMethods);

// Admin Routes to manage numbers
router.post('/methods', protect, admin, addPaymentMethod);
router.delete('/methods/:id', protect, admin, deletePaymentMethod);

// Existing Payment Routes
router.route('/')
    .post(protect, createPayment)
    .get(protect, admin, getAllPayments);

router.route('/:id')
    .delete(protect, admin, deletePayment);

router.route('/:id/verify')
    .put(protect, admin, verifyPayment);

router.route('/:id/reject')
    .put(protect, admin, rejectPayment);

module.exports = router;