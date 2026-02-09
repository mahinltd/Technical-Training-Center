const Admission = require('../models/Admission');
const Payment = require('../models/Payment');
const OnlineClass = require('../models/OnlineClass');
const User = require('../models/User'); 

// @desc    Get Student Dashboard Data
// @route   GET /api/dashboard/student
const getStudentDashboard = async (req, res) => {
    try {
        // ✅ FIXED: Fetch ALL admissions (Pending & Approved)
        // যাতে স্টুডেন্ট অ্যাপ্লাই করার সাথে সাথেই দেখতে পায়
        const myAdmissions = await Admission.find({ 
            user: req.user._id 
        })
        .populate('course', 'title titleBn duration fee') // fee যোগ করেছি যাতে পেমেন্ট দেখাতে পারি
        .populate('paymentId', 'totalAmount receiptNo status')
        .sort({ createdAt: -1 });

        const dashboardData = await Promise.all(myAdmissions.map(async (admission) => {
            // ক্লাস শুধু তখনই দেখাবে যদি স্ট্যাটাস approved হয়
            let classes = [];
            if (admission.status === 'approved') {
                classes = await OnlineClass.find({ 
                    course: admission.course._id,
                    isActive: true 
                });
            }
            
            return {
                admissionInfo: admission,
                classes: classes
            };
        }));

        res.json({
            studentProfile: {
                name: req.user.name,
                studentId: req.user.studentId,
                email: req.user.email,
                phone: req.user.phone,
                photoUrl: req.user.avatar || ""
            },
            enrolledCourses: dashboardData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Receipt Data for PDF
// @route   GET /api/dashboard/receipt/:paymentId
const getReceiptData = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId)
            .populate('user', 'name studentId email phone');

        if (!payment) return res.status(404).json({ message: 'Receipt not found' });

        if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        let itemDetails = {};
        if (payment.sourceType === 'admission') {
            const admission = await Admission.findById(payment.sourceId).populate('course');
            itemDetails = {
                itemName: admission.course.title,
                type: 'Course Admission',
                rollNo: admission.rollNo
            };
        } else {
            itemDetails = { itemName: "Digital Product", type: "Product" };
        }

        res.json({
            receiptNo: payment.receiptNo,
            date: payment.verifiedAt,
            studentDetails: payment.user,
            paymentDetails: {
                method: payment.paymentMethod,
                trxId: payment.transactionId,
                amount: payment.amount,
                fee: payment.transactionFee,
                total: payment.totalAmount
            },
            itemDetails
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/dashboard/admin/stats
const getAdminStats = async (req, res) => {
    try {
        // 1. Total Students
        const totalStudents = await User.countDocuments({ role: 'student' });
        
        // 2. Total Courses (Active Admissions Count or Course Count)
        // Here we count total admissions made
        const totalAdmissions = await Admission.countDocuments({ status: 'approved' });

        // 3. Total Income (Verified Payments Only)
        const payments = await Payment.find({ status: 'verified' });
        const totalIncome = payments.reduce((acc, item) => acc + item.totalAmount, 0);

        // 4. Recent Payments (Last 5)
        const recentPayments = await Payment.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name');

        res.json({
            totalStudents,
            totalAdmissions,
            totalIncome,
            recentPayments
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStudentDashboard, getReceiptData, getAdminStats };
