const Admission = require("../models/Admission");
const Course = require("../models/Course");
const User = require("../models/User"); 
const sendEmail = require("../utils/emailService"); 

// ... (applyForAdmission এবং getMyAdmissions ফাংশন আগের মতোই থাকবে) ...

const applyForAdmission = async (req, res) => {
  // ... (আপনার আগের কোড যা আছে তাই থাকবে, এখানে আমি রিপিট করছি না) ...
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized." });

    const { courseId, session, fatherName, motherName, dateOfBirth, gender, religion, maritalStatus, nidOrBirthCert, presentAddress, guardianPhone, photoUrl, signatureUrl } = req.body;

    if (!courseId || !session || !fatherName || !motherName || !dateOfBirth || !gender || !religion || !nidOrBirthCert || !presentAddress || !guardianPhone || !photoUrl || !signatureUrl) {
      return res.status(400).json({ message: "All admission fields are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const alreadyApplied = await Admission.findOne({ user: req.user._id, course: courseId });
    if (alreadyApplied) return res.status(400).json({ message: "You have already applied for this course" });

    const admission = new Admission({
      user: req.user._id,
      course: courseId,
      session, fatherName, motherName, dateOfBirth, gender, religion, maritalStatus, nidOrBirthCert, presentAddress, guardianPhone, photoUrl, signatureUrl, status: "pending"
    });

    const createdAdmission = await admission.save();

    // Notify Admins (Email Logic)
    try {
        const admins = await User.find({ role: "admin" });
        if (admins.length > 0) {
            admins.forEach(admin => {
                sendEmail({
                    to: admin.email,
                    subject: `New Admission: ${course.title}`,
                    html: `<p>New student applied. ID: ${createdAdmission._id}</p>`
                });
            });
        }
    } catch (e) { console.log("Email error", e); }

    res.status(201).json(createdAdmission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.find({ user: req.user._id }).populate("course", "title fee duration").sort({ createdAt: -1 });
    res.json(admissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.find({}).populate("user", "name studentId email phone").populate("course", "title fee").sort({ createdAt: -1 });
    res.json(admissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW FUNCTION: Get Single Admission by ID (For Payment Page)
// এটি যোগ করুন
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
  getAdmissionById // ✅ Export Added
};
