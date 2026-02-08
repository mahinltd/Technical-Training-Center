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
      // Extract token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          message: "Not authorized, user not found",
        });
      }

      req.user = user;
      return next(); // 🔥 VERY IMPORTANT
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  // No token
  return res.status(401).json({
    message: "Not authorized, no token",
  });
};

/**
 * @desc    Admin only middleware
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Not authorized as an admin",
  });
};

module.exports = { protect, admin };
