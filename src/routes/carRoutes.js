import express from "express";
import {protect, authorize } from "../middleware/authMiddleware.js"
import { createCar, updateCar, deleteCar } from "../controllers/carController.js";

const router = express.Router();


// In carRoutes.js
router.post("/", protect, authorize("seller"), createCar);
router.put("/:id", protect, authorize("seller"), updateCar);
router.delete("/:id", protect, authorize("seller", "admin"), deleteCar);

export default router;