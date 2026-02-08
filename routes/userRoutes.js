const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getUserProfile,
    updateUserProfile, 
    verifyEmail,
    makeAdminByCode,
    forgotPassword, 
    resetPassword, 
    getAllUsers,
    deleteUser,
    updateUserRole,
    sendContactMessage // ✅ FIXED: Added this import here
} = require('../controllers/authController');

const { protect, admin } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email', verifyEmail);
router.put('/make-admin', makeAdminByCode);

// ✅ Contact Route (Now it will work)
router.post('/contact', sendContactMessage);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// Protected Routes (Student/User)
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile); // Update Profile

// Admin Routes
router.route('/')
    .get(protect, admin, getAllUsers);

router.route('/:id')
    .delete(protect, admin, deleteUser);

router.route('/:id/role')
    .put(protect, admin, updateUserRole);

module.exports = router;
