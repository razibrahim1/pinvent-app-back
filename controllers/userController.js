const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModels");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please fill in all required fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password should be more than 6 characters" });
    }

    // Check if a user with the same email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "Email has already been registered" });
    }

    // Create a new user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate Token
    const token = generateToken(user._id);

    // Send http-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });

    if (user) {
      const { _id, name, email, photo, phone, bio } = user;
      return res.status(201).json({ _id, name, email, photo, phone, bio });
    } else {
      return res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate Request
  if (!email || !password) {
    return res.status(400).json({ error: "Please add email and password" });
  }

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: "User not found. Please sign up." });
  }

  // Check if the entered password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  if (passwordIsCorrect) {
    // Generate Token
    const token = generateToken(user._id);

    // Send http-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });

    const { _id, name, email, photo, phone, bio } = user;
    return res.status(200).json({ _id, name, email, photo, phone, bio });
  } else {
    return res.status(400).json({ error: "Invalid email or password" });
  }
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    path: "/",
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully logged out" });
});

// Get user Data
const getUser = asyncHandler(async (req, res) => {
  try {
    // Get the user ID from the authenticated request (token)
    const userId = req.user.id; // Assuming your token contains the user ID as "id"

    // Fetch user data based on the user ID
    const user = await User.findById(userId);

    if (user) {
      const { _id, name, email, photo, phone, bio } = user;
      console.log("User found:", user);
      return res.status(200).json({ _id, name, email, photo, phone, bio });
    } else {
      return res.status(404).json({ error: " Not authorized please login first" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get the login status

const loginStatus = asyncHandler (async(req, res) => {

  const token = req.cookies.token;
  if(!token){
    return res.json(false);
  }
  //Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET)
  if(verified){
    return res.json(true);
  }
  return res.json(false)
});

//Update User

const updateUser = asyncHandler(async (req, res) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.user._id);

    if (user) {
      // Destructure user's current information
      const { name, email, photo, phone, bio } = user;

      // Update user properties with values from the request body if provided,
      // otherwise, keep the current values
      user.email = req.body.email || email;
      user.name = req.body.name || name;
      user.phone = req.body.phone || phone;
      user.bio = req.body.bio || bio;
      user.photo = req.body.photo || photo;

      // Save the updated user to the database
      const updatedUser = await user.save();

      // Respond with the updated user information
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        photo: updatedUser.photo,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
      });
    } else {
      // If the user is not found, return a 404 error
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    // Handle any errors that occur during the update process
    console.error("Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});
 
// Change Password
const changePassword = asyncHandler(async (req, res) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.user._id);
    const { oldPassword, password } = req.body;

    // Check if the user exists
    if (!user) {
      return res.status(400).json({ error: "User not found. Please sign up." });
    }

    // Validate input: Ensure both old and new passwords are provided
    if (!oldPassword || !password) {
      return res.status(400).json({ error: "Please provide both old and new passwords." });
    }

    // Check if the old password matches the one in the database
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    // Update the password if it's correct
    if (passwordIsCorrect) {
      user.password = password;
      await user.save();
      return res.status(200).send("Password has been successfully changed.");
    } else {
      return res.status(400).json({ error: "Old password is incorrect." });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: "User does not exist." });
    } else {

      //Delete Token if it exists in DB

      let token = await Token.findOne({userId: user._id})   
      
      if (token) {
        await token.deleteOne();
      }

      // Create a reset token
      let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
      console.log(resetToken);

      // Hash the token before saving it to the database
      const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

      // Save the token to the database with an expiration time
      await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiredAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      }).save();

      // Construct the reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

      // Compose the reset email message
      const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the URL below to reset your password.</p>
        <p>This reset link is valid for 30 minutes.</p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        <p>Regards...</p>
        <p>Pinvent Team</p>
      `;

      const subject = "Password Reset Request";
      const send_to = user.email;
      const sent_from = process.env.EMAIL_USER;

      // Send the reset email
      await sendEmail(subject, message, send_to, sent_from);
      return res.status(200).json({ success: true, message: "Reset Email Sent" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Email not sent. Please try again." });
  }
});

//Reset Password

const resetPassword = asyncHandler(async(req,res)=> {

  const {password}= req.body
  const {resetToken}= req.params

  // Hash the token then compare to token in DB 
  const hashedToken = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

  // Find Token in DB

  const userToken = await Token.findOne({
    token: hashedToken,
    expiredAt: {$gt: Date.now()}
  })

  if (!userToken) {
    onsole.error("Error:", error);
    return res.status(404).json({ error: "Invalid or Expired Token." });
  }

  //Find User

  const user = await User.findOne({_id: userToken.userId})
  user.password = password;
  await user.save();
  res.status(200).json({
    message: " Password reset successful, Please login"
  })

});



module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
