import express from 'express';
import {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  getCarsByCategory,
  checkAvailability
} from '../controllers/carController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.route('/')
  .get(getCars);

router.route('/:id')
  .get(getCar);

router.route('/category/:category')
  .get(getCarsByCategory);

router.route('/:id/availability')
  .get(checkAvailability);

// Protected routes (authenticated users)
router.use(protect);

// Owner/admin restricted routes
router.route('/')
  .post(authorize('seller', 'admin'), createCar);

router.route('/:id')
  .put(authorize('seller', 'admin'), updateCar)
  .delete(authorize('seller', 'admin'), deleteCar);

export default router;