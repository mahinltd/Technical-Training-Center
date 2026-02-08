const express = require('express');
const router = express.Router();
const {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
} = require('../controllers/courseController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getCourses) // Public: Everyone can see courses
    .post(protect, admin, createCourse); // Admin only: Create course

router.route('/:id')
    .get(getCourseById) // Public
    .put(protect, admin, updateCourse) // Admin only
    .delete(protect, admin, deleteCourse); // Admin only

module.exports = router;