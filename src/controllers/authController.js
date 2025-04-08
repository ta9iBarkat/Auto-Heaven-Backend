import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import asyncHandler from "express-async-handler";
import sendEmail from "../utils/emailService.js";
import { Console } from "console";


// Temporary storage for unverified users
const unverifiedUsers = new Map();


// @desc    Register a new user (with email verification)
// @route   POST /api/auth/register
// @access  Public

export const registerUser = asyncHandler(async (req, res) => {
  const { name, surname, email, password, contactDetails, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }


  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Temporarily store user data (not in MongoDB yet)
  unverifiedUsers.set(verificationToken, {
    name,
    surname,
    email,
    password,
    contactDetails,
    role,
  });
  console.log(process.env.FRONTEND_URL)
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  // Email message
  const message = `Welcome to AutoHeaven! Please verify your email by clicking on the link: ${verificationUrl}`;

  // Send verification email
  console.log(email)
  await sendEmail({
    email: email,
    subject: "Verify Your Email - AutoHeaven",
    message,
  });

  res.status(200).json({
    message: "Verification email sent. Please check your inbox.",
  });
});

// @desc    Verify email and activate account
// @route   GET /api/auth/verify-email/:token
// @access  Public

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Retrieve user data from temporary storage
  const userData = unverifiedUsers.get(token);

  if (!userData) {
    res.status(400);
    throw new Error("Invalid or expired verification token");
  }

  try {
    // Save user in MongoDB now that they verified their email
    const user = await User.create({
      name: userData.name,
      surname: userData.surname,
      email: userData.email,
      password: userData.password,
      contactDetails: userData.contactDetails,
      role: userData.role,
      isVerified: true, // Mark as verified immediately
    });

    // Generate tokens AFTER user is created
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);


    // Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save(); // Save refresh token to DB

    // Remove from temporary storage
    unverifiedUsers.delete(token);

    // Store token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Email verified successfully",
      accessToken,
      _id: user._id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
    });

  } catch (error) {
    console.error("❌ Token generation failed:", error);
    res.status(500);
    throw new Error("Failed to generate authentication token");
  }
});


// @desc    Login user
// @route   POST /api/auth/login
// @access  Public

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });

  console.log("User found:", user);
  console.log("Entered Password:", password);
  console.log("Stored Hash:", user.password);
  console.log("Password Match:", await bcrypt.compare(password, user.password));

  if (!user || !(await user.matchPassword(password))) {
    res.status(400);
    throw new Error("Invalid email or password");
  }

  // Generate JWT
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  // Store token in HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    accessToken,
    _id: user._id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    role: user.role,
    message: "Login successful",
  });
});




// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public

export const logoutUser = asyncHandler(async (req, res) => {

  const { refreshToken } = req.cookies;

  const user = await User.findOne({ refreshToken })

  if(user){
    user.refreshToken = null;
    await user.save()
  }

  res.clearCookie("refreshToken",{
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  })
  
  res.json({ message: "Logged out successfully" });
});


// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
// @access  Public

export const forgotPassword = asyncHandler(async(req, res) =>{
  const {email} = req.body;
  console.log(req.body.email)
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");


  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins expiry

  await user.save();


  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
  const message = `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message, 
    })

    res.status(200).json({message: "Password reset email sent successfully"})
  } catch (error) {
    // 🔹 If email fails, remove token & expiry
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(500);
    throw new Error("Email could not be sent");   
  }
})


//  @desc Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  // Hash the token from the URL
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with matching token & check expiry
  const user = await User.findOne({
    resetPasswordExpires: { $gt: Date.now() }, // Ensure token is not expired
    resetPasswordToken: hashedToken,
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }

  // Remove reset token fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  
  user.password = password

  await user.save();

  res.status(200).json({ message: "Password reset successful, you can now log in" });
});


// @desc    get refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public

export const refreshToken = asyncHandler(async(req, res) =>{
  const { refreshToken } = res.cookies;

  if(!refreshToken){
    res.status(401);
    throw new Error("No refresh token provided");
  }

  const user = await User.findOne({ refreshToken });

  if(!user){
    res.status(403);
    throw new Error("Invalid refresh token");
  }
  try {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); //check token expiration
    newAccessToken = generateAccessToken(user);

    res.status(200).json({newAccessToken})

  } catch (error) {
    res.status(403);
    throw new Error("Invalid refresh token");

  }

})

