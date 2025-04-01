import express from "express";
import { registerUser, loginUser, logoutUser, verifyEmail, forgotPassword, resetPassword, refreshToken } from "../controllers/authController.js";
import loginLimiter from "./middleware/rateLimiter.js"

const router = express.Router();

// Register a new user
router.post("/register", registerUser);

// Login user
router.post("/login", loginLimiter, loginUser);

// Logout user
router.post("/logout", logoutUser);

// email verification
router.get("/verify-email/:token", verifyEmail);

// password rest
router.post("/forgot-password", forgotPassword); // to send an email
router.post("/reset-password/:token", resetPassword);

// generate access token
router.post("/refresh-token", refreshToken)

export default router;
