const Payment = require('../models/Payment');
const Admission = require('../models/Admission');
const Product = require('../models/Product');
const Course = require('../models/Course');
const PaymentMethod = require('../models/PaymentMethod'); // <--- Import New Model
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

// Helper: Generate Receipt Number
const generateReceiptNo = async () => {
    const count = await Payment.countDocuments({ status: 'verified' });
    const year = new Date().getFullYear();
    const uniqueNum = 1000 + count + 1;
    return `RCP-${year}-${uniqueNum}`;
};

// Helper: Generate Roll Number
const generateRollNo = async (courseId) => {
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const count = await Admission.countDocuments({ status: 'approved', course: courseId });
    const serial = (count + 1).toString().padStart(3, '0');
    return `${yearSuffix}1${serial}`;
};

// --- NEW: Payment Method Controllers ---

// @desc    Get All Active Payment Numbers (Public)
// @route   GET /api/payments/methods
const getPaymentMethods = async (req, res) => {
    try {
        const methods = await PaymentMethod.find({ isActive: true });
        res.json(methods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add New Payment Number (Admin)
// @route   POST /api/payments/methods
const addPaymentMethod = async (req, res) => {
    const { methodName, number, accountType } = req.body;
    try {
        const method = await PaymentMethod.create({
            methodName,
            number,
            accountType
        });
        res.status(201).json(method);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Payment Number (Admin)
// @route   DELETE /api/payments/methods/:id
const deletePaymentMethod = async (req, res) => {
    try {
        const method = await PaymentMethod.findById(req.params.id);
        if (method) {
            await method.deleteOne();
            res.json({ message: 'Payment method removed' });
        } else {
            res.status(404).json({ message: 'Method not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- END NEW CONTROLLERS ---

// @desc    Submit Payment Info (Student) -> Notify Admin
const createPayment = async (req, res) => {
    const { admissionId, paymentMethod, senderMobile, transactionId, sourceType, sourceId } = req.body;

    let finalSourceType = sourceType || 'admission';
    let finalSourceId = sourceId || admissionId;
    let amount = 0;
    let itemName = "Unknown Item";
    const allowedMethods = ['bkash', 'nagad', 'rocket', 'offline'];
    const normalizedMethod = paymentMethod?.toLowerCase();

    if (!normalizedMethod || !allowedMethods.includes(normalizedMethod)) {
        return res.status(400).json({ message: 'Invalid payment method selection' });
    }

    if (!finalSourceId) {
        return res.status(400).json({ message: 'Missing payment source reference' });
    }

    if (normalizedMethod === 'offline' && finalSourceType !== 'admission') {
        return res.status(400).json({ message: 'Offline payment is only available for admissions at the coaching center' });
    }

    try {
        if (finalSourceType === 'admission') {
            const admission = await Admission.findById(finalSourceId).populate('course');
            if (!admission) return res.status(404).json({ message: 'Admission not found' });
            amount = admission.course.fee;
            itemName = admission.course.title;
        } else if (finalSourceType === 'course') {
            const course = await Course.findById(finalSourceId);
            if (!course) return res.status(404).json({ message: 'Course not found' });
            amount = course.fee;
            itemName = course.title;
        } else if (finalSourceType === 'product') {
            const product = await Product.findById(finalSourceId);
            if (!product || !product.isActive) {
                return res.status(404).json({ message: 'Product not found or inactive' });
            }
            amount = product.price;
            itemName = product.title;
        } else {
            return res.status(400).json({ message: 'Unsupported payment source' });
        }

        const existingPayment = await Payment.findOne({
            user: req.user._id,
            sourceType: finalSourceType,
            sourceId: finalSourceId,
            status: { $in: ['pending', 'verified'] }
        });
        if (existingPayment) {
            return res.status(400).json({ message: 'You already submitted a payment for this item' });
        }

        const trxFee = (normalizedMethod === 'offline' && finalSourceType === 'admission') ? 20 : 30;
        const total = amount + trxFee;

        const payment = new Payment({
            user: req.user._id,
            sourceType: finalSourceType,
            sourceId: finalSourceId,
            amount: amount,
            transactionFee: trxFee,
            totalAmount: total,
            paymentMethod: normalizedMethod,
            senderMobile,
            transactionId,
            status: 'pending'
        });

        const createdPayment = await payment.save();
        
        if (finalSourceType === 'admission') {
            const admission = await Admission.findById(finalSourceId);
            admission.paymentId = createdPayment._id;
            await admission.save();
        }

        // Notify Admins
        const admins = await User.find({ role: 'admin' });
        if (admins.length > 0) {
            await Promise.all(admins.map(async (admin) => {
                await sendEmail({
                    to: admin.email,
                    subject: `New Payment Received: ${transactionId}`,
                    html: `
                        <h2>New Payment Submitted!</h2>
                        <p>Student: ${req.user.name}</p>
                        <p>Amount: ${total} BDT</p>
                        <p>TrxID: ${transactionId}</p>
                    `
                });
            }));
        }

        res.status(201).json(createdPayment);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify Payment (Admin)
const verifyPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('user');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        if (payment.status === 'verified') return res.status(400).json({ message: 'Already verified' });

        payment.status = 'verified';
        payment.verifiedBy = req.user._id;
        payment.verifiedAt = Date.now();
        payment.receiptNo = await generateReceiptNo();
        
        await payment.save();

        let rollNo = "";
        let itemName = "Service";

        if (payment.sourceType === 'admission') {
            const admission = await Admission.findById(payment.sourceId).populate('course');
            if (admission) {
                admission.status = 'approved';
                rollNo = await generateRollNo(admission.course);
                admission.rollNo = rollNo;
                await admission.save();
                itemName = admission.course.title;
            }
        }

        if (payment.user && payment.user.email) {
            await sendEmail({
                to: payment.user.email,
                subject: `Payment Receipt - ${payment.receiptNo}`,
                html: `
                    <h2>Payment Verified!</h2>
                    <p>Receipt No: ${payment.receiptNo}</p>
                    <p>Item: ${itemName}</p>
                    ${rollNo ? `<p>Roll No: ${rollNo}</p>` : ''}
                `
            });
        }

        res.json({ message: 'Verified', receiptNo: payment.receiptNo });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject Payment (Admin)
const rejectPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (payment) {
            payment.status = 'rejected';
            await payment.save();
            res.json({ message: 'Payment rejected' });
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const buildSourceDetails = async (payment) => {
    try {
        if (payment.sourceType === 'admission') {
            const admission = await Admission.findById(payment.sourceId)
                .populate('course', 'title fee duration');
            if (!admission) return null;
            return {
                type: 'admission',
                title: admission.course?.title || 'Admission',
                fee: admission.course?.fee,
                duration: admission.course?.duration,
                session: admission.session,
                status: admission.status
            };
        }

        if (payment.sourceType === 'course') {
            const course = await Course.findById(payment.sourceId)
                .select('title fee duration type');
            if (!course) return null;
            return {
                type: 'course',
                title: course.title,
                fee: course.fee,
                duration: course.duration,
                courseType: course.type
            };
        }

        if (payment.sourceType === 'product') {
            const product = await Product.findById(payment.sourceId)
                .select('title price type description logoKey thumbnailUrl');
            if (!product) return null;
            return {
                type: 'product',
                title: product.title,
                price: product.price,
                productType: product.type,
                description: product.description,
                logoKey: product.logoKey,
                thumbnailUrl: product.thumbnailUrl
            };
        }
    } catch (error) {
        console.error('Source detail fetch failed', error.message);
    }

    return null;
};

// @desc    Get All Payments (Admin)
const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find({})
            .populate('user', 'name studentId email phone')
            .sort({ createdAt: -1 });

        const enriched = await Promise.all(
            payments.map(async (paymentDoc) => {
                const payment = paymentDoc.toObject();
                payment.sourceDetails = await buildSourceDetails(payment);
                return payment;
            })
        );

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Payment (Admin)
const deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (payment) {
            await payment.deleteOne();
            res.json({ message: 'Payment record removed' });
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    List verified product purchases for a student
// @route   GET /api/payments/my/downloads
const getMyProductDownloads = async (req, res) => {
    try {
        const payments = await Payment.find({
            user: req.user._id,
            sourceType: 'product',
            status: 'verified'
        }).sort({ verifiedAt: -1, createdAt: -1 });

        const downloads = await Promise.all(
            payments.map(async (paymentDoc) => {
                const product = await Product.findById(paymentDoc.sourceId)
                    .select('title titleBn type logoKey price thumbnailUrl description isActive');
                if (!product || !product.isActive) return null;

                return {
                    paymentId: paymentDoc._id,
                    productId: product._id,
                    title: product.title,
                    titleBn: product.titleBn,
                    type: product.type,
                    logoKey: product.logoKey,
                    price: product.price,
                    thumbnailUrl: product.thumbnailUrl,
                    description: product.description,
                    verifiedAt: paymentDoc.verifiedAt,
                    receiptNo: paymentDoc.receiptNo
                };
            })
        );

        res.json(downloads.filter(Boolean));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createPayment, 
    verifyPayment, 
    rejectPayment,
    getAllPayments,
    deletePayment,
    // Exports new functions
    getPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
    getMyProductDownloads
};
