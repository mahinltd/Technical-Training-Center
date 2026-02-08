const Course = require('../models/Course');

// @desc    Fetch all active courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
    try {
        // Only fetch active courses for students
        const courses = await Course.find({ isActive: true });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (course) {
            res.json(course);
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Admin
const createCourse = async (req, res) => {
    const { title, titleBn, description, descriptionBn, fee, duration } = req.body;

    try {
        const course = new Course({
            title,
            titleBn,
            description,
            descriptionBn,
            fee,
            duration,
        });

        const createdCourse = await course.save();
        res.status(201).json(createdCourse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Admin
const updateCourse = async (req, res) => {
    const { title, titleBn, description, descriptionBn, fee, duration, isActive } = req.body;

    try {
        const course = await Course.findById(req.params.id);

        if (course) {
            course.title = title || course.title;
            course.titleBn = titleBn || course.titleBn;
            course.description = description || course.description;
            course.descriptionBn = descriptionBn || course.descriptionBn;
            course.fee = fee || course.fee;
            course.duration = duration || course.duration;
            
            // Check if isActive is passed in body, otherwise keep old value
            if (typeof isActive !== 'undefined') {
                course.isActive = isActive;
            }

            const updatedCourse = await course.save();
            res.json(updatedCourse);
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete (Soft Delete) a course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (course) {
            // We do soft delete (mark as inactive) to preserve payment history
            course.isActive = false; 
            await course.save();
            res.json({ message: 'Course removed (set to inactive)' });
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
};