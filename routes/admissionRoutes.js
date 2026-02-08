const express = require('express');
const router = express.Router();
const {
    applyForAdmission,
    getMyAdmissions,
    getAllAdmissions
} = require('../controllers/admissionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, applyForAdmission) // Student applies
    .get(protect, admin, getAllAdmissions); // Admin views all

router.route('/my')
    .get(protect, getMyAdmissions); // Student views own history

module.exports = router;