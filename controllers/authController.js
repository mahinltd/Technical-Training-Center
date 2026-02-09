const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Utility to generate custom ID
const generateStudentId = () => {
    const prefix = "TCTC";
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}${randomNum}`;
};

// @desc    Register a new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let uniqueId = generateStudentId();
        const idExists = await User.findOne({ studentId: uniqueId });
        if (idExists) {
            uniqueId = generateStudentId();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verifyToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            studentId: uniqueId,
            verificationToken: verifyToken,
            isVerified: false
        });

        if (user) {
            const verificationLink = `https://technicalcomputer.tech/verify-email?token=${verifyToken}`;

            await sendEmail({
                to: user.email,
                subject: 'Verify Your Account - TCTC',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                        <h2 style="color: #0056b3;">Welcome, ${user.name}!</h2>
                        <p>Your Student ID: <strong>${user.studentId}</strong></p>
                        <a href="${verificationLink}" 
                           style="background-color: #28a745; color: white; padding: 10px 20px; 
                                  text-decoration: none; border-radius: 5px;">
                           Verify Email
                        </a>
                    </div>
                `
            });

            res.status(201).json({
                message: "Registration successful. Check email.",
                _id: user._id,
                studentId: user.studentId,
                email: user.email
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                studentId: user.studentId,
                name: user.name,
                email: user.email,
                phone: user.phone, // ✅ FIXED: Phone added here
                role: user.role,
                isVerified: user.isVerified,
                avatar: user.avatar,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                studentId: user.studentId,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone, // ✅ FIXED: Phone added here
                avatar: user.avatar,
                isVerified: user.isVerified
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update User Profile
// @route   PUT /api/users/profile
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.avatar = req.body.avatar || user.avatar;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone, // ✅ FIXED: Phone added here
                avatar: updatedUser.avatar,
                token: generateToken(updatedUser._id)
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify User Email
// @route   GET /api/users/verify-email
const verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) return res.status(400).send('<h1>Invalid Token</h1>');

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.send('<h1>Email Verified Successfully! ✅</h1>');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Promote to Admin (Secret Code)
// @route   PUT /api/users/make-admin
const makeAdminByCode = async (req, res) => {
    const { email, secretCode } = req.body;
    try {
        if (secretCode !== process.env.ADMIN_SECRET_KEY) {
            return res.status(403).json({ message: 'Invalid Admin Security Code!' });
        }
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.role = 'admin';
        await user.save();

        res.json({ message: `Success! ${user.name} is now an Admin.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot Password
// @route   POST /api/users/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        const resetUrl =
            `https://technicalcomputer.tech/reset-password/${resetToken}`;

        const message = `
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Password Reset - TCTC',
            html: message
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   PUT /api/users/reset-password/:resetToken
const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid token' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Password updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user (Admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role (Admin)
const updateUserRole = async (req, res) => {
    const { role } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.role = role || user.role;
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send Contact Message to Admin
// @route   POST /api/users/contact
const sendContactMessage = async (req, res) => {
    const { name, email, message } = req.body;

    try {
        if (!name || !email || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const adminEmail = "info.mahin.ltd@gmail.com"; 

        await sendEmail({
            to: adminEmail,
            subject: `New Inquiry from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color: #0056b3;">New Contact Message</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <hr />
                    <p><strong>Message:</strong></p>
                    <blockquote style="background: #f9f9f9; padding: 15px; border-left: 5px solid #0056b3;">
                        ${message}
                    </blockquote>
                </div>
            `
        });

        res.status(200).json({ message: "Message sent successfully!" });

    } catch (error) {
        console.error("Contact Error:", error);
        res.status(500).json({ message: "Failed to send message." });
    }
};

module.exports = {
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
    sendContactMessage
};
