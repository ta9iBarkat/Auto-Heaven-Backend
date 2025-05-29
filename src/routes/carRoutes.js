import express from 'express';
import upload from '../middleware/uploadMiddleware.js'; // Multer middleware for file uploads
import {
  deleteCarImage,
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


router.post('/', upload.array('images', 10), createCar); // Allow up to 10 images

// Owner/admin restricted routes

router.route('/:id')
.put(authorize('seller', 'admin'), updateCar)
.delete(authorize('seller', 'admin'), deleteCar);



router.delete('/:carId/images/:publicId', deleteCarImage);

export default router;