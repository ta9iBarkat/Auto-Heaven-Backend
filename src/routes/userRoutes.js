import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserProfile, updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);

router.put("/profile", protect, updateUserProfile);

export default router;
