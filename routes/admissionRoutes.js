const express = require('express');
const router = express.Router();
const {
    applyForAdmission,
    getMyAdmissions,
    getAllAdmissions,
    getAdmissionById // ✅ IMPORT ADDED
} = require('../controllers/admissionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, applyForAdmission) // Student applies
    .get(protect, admin, getAllAdmissions); // Admin views all

router.route('/my')
    .get(protect, getMyAdmissions); // Student views own history

// ✅ NEW ROUTE ADDED: Get single admission by ID
router.route('/:id')
    .get(protect, getAdmissionById);

module.exports = router;
