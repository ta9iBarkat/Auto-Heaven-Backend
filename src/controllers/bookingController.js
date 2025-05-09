import Booking from '../models/Booking.js';
import Car from '../models/Car.js';


// @desc    Get all bookings (admin only)
// @route   GET /api/bookings
export const getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('car', 'title images')
      .populate('user', 'name email');
    
    res.status(200).json({ 
      success: true, 
      count: bookings.length, 
      data: bookings 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booking
// @route   POST /api/bookings
export const createBooking = async (req, res, next) => {
  try {
    const { carId, startDate, endDate } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return next(new ErrorResponse('Car not found', 404));
    }

    // Check availability
    const isAvailable = !car.bookedDates.some(booking => 
      new Date(startDate) < booking.endDate && 
      new Date(endDate) > booking.startDate
    );
    
    if (!isAvailable) {
      return next(new ErrorResponse('Car is not available for selected dates', 400));
    }

    const booking = await Booking.create({
      car: carId,
      user: req.user.id,
      startDate,
      endDate
    });

    res.status(201).json({ 
      success: true, 
      data: booking 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booking status (owner/admin only)
// @route   PUT /api/bookings/:id/status
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('car');

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Verify car owner or admin
    if (booking.car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this booking', 401));
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({ 
      success: true, 
      data: booking 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Verify booking owner
    if (booking.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to cancel this booking', 401));
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ 
      success: true, 
      data: booking 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get bookings for specific car (owner/admin only)
// @route   GET /api/cars/:carId/bookings
export const getCarBookings = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.carId);

    if (!car) {
      return next(new ErrorResponse('Car not found', 404));
    }

    // Verify car owner or admin
    if (car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to view these bookings', 401));
    }

    const bookings = await Booking.find({ car: req.params.carId })
      .populate('user', 'name email');

    res.status(200).json({ 
      success: true, 
      count: bookings.length, 
      data: bookings 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's bookings
// @route   GET /api/users/:userId/bookings
export const getUserBookings = async (req, res, next) => {
  try {
    // Verify requested user matches authenticated user (or admin)
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to view these bookings', 401));
    }

    const bookings = await Booking.find({ user: req.params.userId })
      .populate('car', 'title images');

    res.status(200).json({ 
      success: true, 
      count: bookings.length, 
      data: bookings 
    });
  } catch (err) {
    next(err);
  }
};