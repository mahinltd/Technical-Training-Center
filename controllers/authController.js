const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const trimTrailingSlash = (url = '') => (url.endsWith('/') ? url.slice(0, -1) : url);
const getFrontendBaseUrl = () => trimTrailingSlash(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://technicalcomputer.tech');
const buildVerificationLink = (token) => `${getFrontendBaseUrl()}/verify-email?token=${token}`;
const buildResetLink = (token) => `${getFrontendBaseUrl()}/reset-password/${token}`;

const buildVerificationHtml = ({ title, message, buttonLabel, buttonHref, isSuccess }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; background:#f4f4f4; padding:40px; }
        .card { max-width:480px; margin:0 auto; background:#fff; padding:32px; border-radius:12px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.08); }
        h1 { color:${isSuccess ? '#047857' : '#b91c1c'}; font-size:24px; margin-bottom:16px; }
        p { color:#475569; font-size:16px; line-height:1.6; margin-bottom:28px; }
        a.button { display:inline-block; padding:12px 24px; border-radius:8px; text-decoration:none; color:#fff; font-weight:600; background:${isSuccess ? '#047857' : '#b91c1c'}; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
        <a class="button" href="${buttonHref}" target="_self">${buttonLabel}</a>
    </div>
</body>
</html>
`;

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
            const verificationLink = buildVerificationLink(verifyToken);

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
    const prefersJson = () => {
        const acceptHeader = (req.headers.accept || '').toLowerCase();
        return acceptHeader.includes('application/json') || acceptHeader.includes('text/json');
    };

    const sendResponse = (statusCode, jsonBody, htmlBody) => {
        if (prefersJson()) {
            return res.status(statusCode).json(jsonBody);
        }
        return res.status(statusCode).send(buildVerificationHtml({ ...htmlBody, isSuccess: statusCode >= 200 && statusCode < 400 }));
    };

    if (!token) {
        return sendResponse(
            400,
            { success: false, message: 'Verification token is missing' },
            {
                title: 'Verification link missing',
                message: 'We could not find a verification token in your request. Please request a new verification email.',
                buttonLabel: 'Resend Email',
                buttonHref: `${getFrontendBaseUrl()}/auth/resend-email`
            }
        );
    }

    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return sendResponse(
                400,
                { success: false, message: 'Invalid or expired verification link' },
                {
                    title: 'Link expired or invalid',
                    message: 'This verification link is no longer valid. Please request a fresh email to complete your registration.',
                    buttonLabel: 'Request New Link',
                    buttonHref: `${getFrontendBaseUrl()}/auth/resend-email`
                }
            );
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        return sendResponse(
            200,
            { success: true, message: 'Email verified successfully' },
            {
                title: 'Email verified!',
                message: 'Your account is now active. You can log in and start learning right away.',
                buttonLabel: 'Go to Login',
                buttonHref: `${getFrontendBaseUrl()}/auth`
            }
        );
    } catch (error) {
        console.error('Verify email error:', error);
        return sendResponse(
            500,
            { success: false, message: 'Failed to verify email. Please try again.' },
            {
                title: 'Something went wrong',
                message: 'We could not verify your email due to a server error. Please try the link again in a moment or request a new email.',
                buttonLabel: 'Back to Login',
                buttonHref: `${getFrontendBaseUrl()}/auth`
            }
        );
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

        const resetUrl = buildResetLink(resetToken);

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
