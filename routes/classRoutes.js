const express = require('express');
const router = express.Router();
const { addClass, deleteClass, getClassesByCourse } = require('../controllers/classController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes here are for Admin only
router.post('/', protect, admin, addClass);
router.delete('/:id', protect, admin, deleteClass);
router.get('/course/:courseId', protect, admin, getClassesByCourse);

module.exports = router;