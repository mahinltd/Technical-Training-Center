const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * @desc    Protect routes (Login required)
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Extract token
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Get user from token (exclude password)
      // Note: We use 'decoded.id' assuming your generateToken function uses 'id'
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          message: "Not authorized, user not found",
        });
      }

      req.user = user;
      return next(); // ✅ Proceed to controller
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  // If no token found in headers
  return res.status(401).json({
    message: "Not authorized, no token provided",
  });
};

/**
 * @desc    Admin only middleware
 */
const admin = (req, res, next) => {
  // Check if user exists and role is strictly 'admin'
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Access denied. Admins only.",
  });
};

module.exports = { protect, admin };
