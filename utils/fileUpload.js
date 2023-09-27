const multer = require("multer");
const path = require("path");

// Define file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // Set the destination path to "uploads" folder in your project directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename based on the current timestamp and the original filename
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

// Specify file format that can be saved
function fileFilter(req, file, cb) {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const upload = multer({ storage, fileFilter });

//File Size formatter

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
  
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  

module.exports = { upload, formatFileSize };
