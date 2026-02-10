const express = require('express');
const router = express.Router();
const {
    applyForAdmission,
    getMyAdmissions,
    getAllAdmissions,
    getAdmissionById // ✅ Import Added
} = require('../controllers/admissionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, applyForAdmission) 
    .get(protect, admin, getAllAdmissions); 

router.route('/my')
    .get(protect, getMyAdmissions); 

// ✅ NEW ROUTE: Get single admission by ID
// এটি যোগ করুন
router.route('/:id')
    .get(protect, getAdmissionById);

module.exports = router;
