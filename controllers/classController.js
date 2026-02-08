const OnlineClass = require('../models/OnlineClass');

// @desc    Add a new class (Admin)
// @route   POST /api/classes
const addClass = async (req, res) => {
    const { courseId, title, meetingLink, scheduledAt } = req.body;

    try {
        const newClass = new OnlineClass({
            course: courseId,
            title,
            meetingLink,
            scheduledAt
        });

        const savedClass = await newClass.save();
        res.status(201).json(savedClass);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a class (Admin)
// @route   DELETE /api/classes/:id
const deleteClass = async (req, res) => {
    try {
        const deletedClass = await OnlineClass.findByIdAndDelete(req.params.id);
        if (deletedClass) {
            res.json({ message: 'Class removed successfully' });
        } else {
            res.status(404).json({ message: 'Class not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all classes for a course (Admin view)
// @route   GET /api/classes/course/:courseId
const getClassesByCourse = async (req, res) => {
    try {
        const classes = await OnlineClass.find({ course: req.params.courseId });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addClass, deleteClass, getClassesByCourse };