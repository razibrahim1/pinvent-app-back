const express = require("express");
const protect = require("../middleWare/authMiddleware");
const { contactUs } = require("../controllers/contactController");
const router = express.Router();

// Route to submit the contact form
router.post("/",protect ,contactUs);

module.exports = router;
