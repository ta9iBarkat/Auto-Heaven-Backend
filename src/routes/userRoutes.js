import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserProfile, updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

// ✅ Get user profile (protected route)
router.get("/profile", protect, getUserProfile);

// ✅ Update user profile (protected route)
router.put("/profile", protect, updateUserProfile);

export default router;
