const Admission = require("../models/Admission");
const Course = require("../models/Course");
const User = require("../models/User"); 
const sendEmail = require("../utils/emailService"); 

/**
 * @desc    Apply for a course
 * @route   POST /api/admissions
 * @access  Private (Student)
 */
const applyForAdmission = async (req, res) => {
  try {
    // 🔐 AUTH GUARD
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized. Please login first.",
      });
    }

    const {
      courseId,
      session,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      religion,
      maritalStatus,
      nidOrBirthCert,
      presentAddress,
      guardianPhone,
      photoUrl,
      signatureUrl,
    } = req.body;

    // 🧪 REQUIRED FIELD CHECK
    if (
      !courseId ||
      !session ||
      !fatherName ||
      !motherName ||
      !dateOfBirth ||
      !gender ||
      !religion ||
      !nidOrBirthCert ||
      !presentAddress ||
      !guardianPhone ||
      !photoUrl ||
      !signatureUrl
    ) {
      return res.status(400).json({
        message: "All admission fields are required",
      });
    }

    // 📚 CHECK COURSE
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 🔁 CHECK DUPLICATE APPLICATION
    const alreadyApplied = await Admission.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (alreadyApplied) {
      return res.status(400).json({
        message: "You have already applied for this course",
      });
    }

    // 📝 CREATE ADMISSION
    const admission = new Admission({
      user: req.user._id,
      course: courseId,
      session,
      fatherName,
      motherName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      religion,
      maritalStatus,
      nidOrBirthCert,
      presentAddress,
      guardianPhone,
      photoUrl,
      signatureUrl,
      status: "pending",
    });

    // ✅ SAVE TO DATABASE
    const createdAdmission = await admission.save();

    // 🖼️ Sync profile avatar with the admission photo so the dashboard shows it immediately
    try {
      await User.findByIdAndUpdate(req.user._id, { avatar: photoUrl });
    } catch (avatarError) {
      console.error("⚠️ Failed to sync student avatar:", avatarError.message);
    }

    // ---------------------------------------------------------
    // 📧 EMAIL NOTIFICATION SYSTEM
    // ---------------------------------------------------------
    try {
      const admins = await User.find({ role: "admin" });

      if (admins.length > 0) {
        const emailSubject = `New Admission Request: ${course.title}`;
        const emailBody = `
            <h3>New Admission Application Received</h3>
            <p><strong>Student Name:</strong> ${req.user.name}</p>
            <p><strong>Student ID:</strong> ${req.user.studentId || "N/A"}</p>
            <p><strong>Course:</strong> ${course.title}</p>
            <p><strong>Session:</strong> ${session}</p>
            <p><strong>Guardian Phone:</strong> ${guardianPhone}</p>
            <hr/>
            <p>Please login to the Admin Dashboard to review and approve this application.</p>
        `;

        await Promise.all(
          admins.map((admin) =>
            sendEmail({
              to: admin.email,
              subject: emailSubject,
              html: emailBody,
            })
          )
        );
      }
    } catch (emailError) {
      console.error("⚠️ Failed to send admin notification emails:", emailError.message);
    }

    res.status(201).json(createdAdmission);
  } catch (error) {
    console.error("Admission Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already applied for this course",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid course selected",
      });
    }

    res.status(500).json({
      message: "Admission submission failed",
      error: error.message,
    });
  }
};

/**
 * @desc    Get logged-in user's admissions
 * @route   GET /api/admissions/my
 * @access  Private
 */
const getMyAdmissions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const admissions = await Admission.find({ user: req.user._id })
      .populate("course", "title fee duration")
      .sort({ createdAt: -1 });

    res.json(admissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all admissions (Admin)
 * @route   GET /api/admissions
 * @access  Admin
 */
const getAllAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.find({})
      .populate("user", "name studentId email phone")
      .populate("course", "title fee")
      .sort({ createdAt: -1 });

    res.json(admissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get Single Admission by ID (For Payment Page & Admin Details)
 * @route   GET /api/admissions/:id
 * @access  Private (Owner or Admin)
 */
// ✅ এই ফাংশনটি মিসিং ছিল, এখন যোগ করা হলো
const getAdmissionById = async (req, res) => {
    try {
        const admission = await Admission.findById(req.params.id).populate('course');
        
        if (!admission) {
            return res.status(404).json({ message: 'Admission record not found' });
        }

        // Security: Only the student or admin can view this
        if (admission.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to view this admission' });
        }

        res.json(admission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  applyForAdmission,
  getMyAdmissions,
  getAllAdmissions,
  getAdmissionById // ✅ EXPORT ADDED
};
