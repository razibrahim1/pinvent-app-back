const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
  try {
    // Check if the token is present in cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Not authorized, please login" });
    }

    // Verify Token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (!verified) {
      return res.status(401).json({ error: "Token verification failed" });
    }

    // Get user id from token and fetch the user data
    const user = await User.findById(verified.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach the user object to the request for further handling
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
});

module.exports = protect;
