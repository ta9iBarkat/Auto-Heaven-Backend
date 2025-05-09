import Car from '../models/Car.js';

// @desc    Get all cars
// @route   GET /api/cars
export const getCars = async (req, res, next) => {
  try {
    const cars = await Car.find().populate('owner', 'name email');
    res.status(200).json({ success: true, count: cars.length, data: cars });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single car
// @route   GET /api/cars/:id
export const getCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id).populate('owner', 'name email');
    if (!car) {
      return next(new ErrorResponse(`Car not found with id ${req.params.id}`, 404));
    }
    res.status(200).json({ success: true, data: car });
  } catch (err) {
    next(err);
  }
};

// @desc    Create car
// @route   POST /api/cars
export const createCar = async (req, res, next) => {
  try {
    // Add owner from authenticated user
    req.body.owner = req.user.id;
    
    const car = await Car.create(req.body);
    res.status(201).json({ success: true, data: car });
  } catch (err) {
    next(err);
  }
};

// @desc    Update car
// @route   PUT /api/cars/:id
export const updateCar = async (req, res, next) => {
  try {
    let car = await Car.findById(req.params.id);

    if (!car) {
      return next(new ErrorResponse(`Car not found with id ${req.params.id}`, 404));
    }

    // Verify ownership
    if (car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Not authorized to update this car`, 401));
    }

    car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: car });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete car
// @route   DELETE /api/cars/:id
export const deleteCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return next(new ErrorResponse(`Car not found with id ${req.params.id}`, 404));
    }

    // Verify ownership
    if (car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Not authorized to delete this car`, 401));
    }

    await car.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Get cars by category
// @route   GET /api/cars/category/:category
export const getCarsByCategory = async (req, res, next) => {
  try {
    const cars = await Car.find({ category: req.params.category })
                         .populate('owner', 'name email');
    res.status(200).json({ success: true, count: cars.length, data: cars });
  } catch (err) {
    next(err);
  }
};

// @desc    Check car availability
// @route   GET /api/cars/:id/availability
export const checkAvailability = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const car = await Car.findById(req.params.id);

    if (!car) {
      return next(new ErrorResponse(`Car not found with id ${req.params.id}`, 404));
    }

    const isAvailable = !car.bookedDates.some(booking => {
      return new Date(startDate) < booking.endDate && 
             new Date(endDate) > booking.startDate;
    });

    res.status(200).json({ 
      success: true, 
      data: { 
        isAvailable,
        message: isAvailable ? 'Car is available' : 'Car is already booked'
      }
    });
  } catch (err) {
    next(err);
  }
};