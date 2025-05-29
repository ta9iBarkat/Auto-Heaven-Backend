import express from 'express';
import {
  getBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  getUserBookings,
  getCarBookings
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protection to all booking routes
router.use(protect);

// User routes
router.route('/')
  .post(createBooking);

router.route('/user/:userId')
  .get(getUserBookings);

router.route('/:id/cancel') 
  .put(cancelBooking);

// Owner/admin routes
router.route('/car/:carId')
  .get(authorize('seller', 'admin'), getCarBookings);

router.route('/:id/status')
  .put(authorize('seller', 'admin'), updateBookingStatus);

// Admin-only routes
router.route('/')
  .get(authorize('admin'), getBookings);



export default router;