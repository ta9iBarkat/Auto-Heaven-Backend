import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contactDetails: { type: Object },
    role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String },
    resetPasswordToken: {type: String},  // Hashed token
    resetPasswordExpires: {type: Date},// 10 mins expiry
  },
  { timestamps: true }
);

// Hash password before saving

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  console.log("Before Hashing:", this.password); // This should be plain text
  this.password = await bcrypt.hash(this.password, 10);
  console.log("After Hashing:", this.password); // This should be a bcrypt hash
  
  next();
});




// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
