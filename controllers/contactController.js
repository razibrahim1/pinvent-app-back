const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

// Controller for handling contact form submission
const contactUs = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(400).json({ error: "User not found please signup" });
  }

  // Validation: Check if required fields are provided
  if (!subject || !message) {
    return res.status(400).json({ error: "Please fill in all required fields" });
  }

  const send_to = process.env.EMAIL_USER;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = user.email;

  try {
    // Send contact form email
    await sendEmail(subject, message, send_to, sent_from, reply_to);

    // Respond with success message
    res.status(200).json({ success: true, message: "Contact form submitted successfully" });
  } catch (error) {
    console.error("Contact form submission error:", error);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
});

module.exports = {
  contactUs,
};
