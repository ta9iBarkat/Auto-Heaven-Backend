import Review from '../models/Review.js';
import Car from '../models/Car.js';


// @desc    Get all reviews
// @route   GET /api/reviews
export const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('car', 'title images')
      .populate('user', 'name email');
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reviews for specific car
// @route   GET /api/cars/:carId/reviews
export const getCarReviews = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.carId);
    
    if (!car) {
      return next(new ErrorResponse('Car not found', 404));
    }

    const reviews = await Review.find({ car: req.params.carId })
      .populate('user', 'name');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add review
// @route   POST /api/cars/:carId/reviews
export const addReview = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.carId);
    
    if (!car) {
      return next(new ErrorResponse('Car not found', 404));
    }

    // Check if user already reviewed this car
    const existingReview = await Review.findOne({
      car: req.params.carId,
      user: req.user.id
    });

    if (existingReview) {
      return next(new ErrorResponse('You have already reviewed this car', 400));
    }

    // Check if user has rented this car (business rule)
    const hasRented = await mongoose.model('Booking').exists({
      car: req.params.carId,
      user: req.user.id,
      status: 'completed'
    });

    if (!hasRented && req.user.role !== 'admin') {
      return next(new ErrorResponse('You must rent the car before reviewing', 403));
    }

    const review = await Review.create({
      car: req.params.carId,
      user: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
export const updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    // Verify review ownership
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this review', 401));
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found', 404));
    }

    // Verify review ownership
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this review', 401));
    }

    await review.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Rate seller (owner)
// @route   POST /api/users/:sellerId/ratings
export const rateSeller = async (req, res, next) => {
  try {
    const seller = await mongoose.model('User').findById(req.params.sellerId);

    if (!seller || seller.role !== 'owner') {
      return next(new ErrorResponse('No car owner found with this ID', 404));
    }

    // Check if user has completed a booking with this seller
    const hasTransaction = await mongoose.model('Booking').exists({
      user: req.user.id,
      status: 'completed',
      car: { $in: await mongoose.model('Car').find({ owner: seller._id }).distinct('_id') }
    });

    if (!hasTransaction) {
      return next(new ErrorResponse('You must complete a booking with this seller first', 403));
    }

    const rating = await mongoose.model('SellerRating').create({
      seller: seller._id,
      user: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment
    });

    res.status(201).json({
      success: true,
      data: rating
    });
  } catch (err) {
    next(err);
  }
};