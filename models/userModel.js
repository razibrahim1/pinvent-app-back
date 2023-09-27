const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"]
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    trim: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please enter a valid email"
    ]
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: [6, "Password must be at least 6 characters long"],
    maxlength: [255, "Password must not exceed 255 characters"]
  },
  photo: {
    type: String,
    default: "https://i.ibb.co/4pDNDk1/avatar.png"
  },
  phone: {
    type: String,
    default: "+972"
  },
  bio: {
    type: String,
    maxlength: [250, "Bio must not exceed 250 characters"],
    default: "Bio"
  },
}, {
  timestamps: true
});

 //Encrypt password before saving to DB
userSchema.pre("save",async function(next) {
    if(!this.isModified("password")){
        return next();
    }

    //Hash Password

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
})

const User = mongoose.model("User", userSchema);
module.exports = User;
