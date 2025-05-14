import express from "express";
import {protect, authorize } from "../middleware/authMiddleware.js"
import {getAllUsers,
    deleteUser,
    updateUserRole} from "../controllers/adminController.js"

let router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/role", updateUserRole);


export default router;