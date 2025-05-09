import express from 'express';
import {
  getReviews,
  getCarReviews,
  addReview,
  updateReview,
  deleteReview,
  rateSeller
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.route('/')
  .get(getReviews);



router.route('/cars/:carId/reviews')
  .get(getCarReviews);

// Protected routes
router.use(protect);

// User review routes
router.route('/cars/:carId/reviews')
  .post(addReview);

router.route('/:id')
  .put(updateReview)
  .delete(deleteReview);

// Seller rating
router.route('/seller/:sellerId')
  .post(rateSeller);

export default router;