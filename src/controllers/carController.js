import asyncHandler from 'express-async-handler';
import Car from '../models/Car.js'; // Ensure path is correct
import { cloudinaryUpload } from '../config/cloudinary.js'; // Ensure path is correct

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
export const getUserCars = async (req, res, next) => {
  try {
    const cars = await Car.find({ owner: req.user.id })
      .populate('owner', 'name email image');
    
    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars
    });
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

/////////////////////////////////////////////////////////////////

// @desc    Create a new car
// @route   POST /api/cars
// @access  Private (Sellers only)


export const createCar = asyncHandler(async (req, res) => {
  const {
    title,
    listingType, // Expected: 'rent' or 'sale'
    category,
  } = req.body;
  const priceStr = req.body.price; // Get price as string/any and parse carefully

  let numericPrice;
  if (priceStr !== undefined && priceStr !== null && String(priceStr).trim() !== "") {
    numericPrice = parseFloat(priceStr);
  }

  // --- Start of Validation ---
  if (!title || !listingType || numericPrice === undefined || isNaN(numericPrice) || !category) {
    res.status(400);
    throw new Error('Please provide title, listingType, a valid numeric price, and category.');
  }

  if (listingType !== 'rent' && listingType !== 'sale') {
    res.status(400);
    throw new Error("listingType must be either 'rent' or 'sale'.");
  }

  // You might want to adjust this validation based on your business rules (e.g., allow free items)
  if (numericPrice <= 0) {
      res.status(400);
      throw new Error('Price must be a positive number.');
  }

  // Validate category against enum values from the model (optional here, Mongoose will do it anyway)
  // const validCategories = ['Luxury', 'Family', 'Van', 'SUV', 'Sports', 'Economy'];
  // if (!validCategories.includes(category)) {
  //   res.status(400);
  //   throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  // }
  // --- End of Validation ---


  // --- Handle Image Uploads ---
  let imagesData = [];
  if (!req.files || req.files.length === 0) {
    // This aligns with the model's validation: `validate: [arrayLimit, '{PATH} must contain at least 1 image']` (for the lower bound)
    res.status(400);
    throw new Error('At least one image is required.');
  }

  if (req.files.length > 10) {
    // This aligns with the model's arrayLimit upper bound.
    res.status(400);
    throw new Error('You can upload a maximum of 10 images.');
  }

  const uploadPromises = req.files.map((file) =>
    cloudinaryUpload(file.buffer, file.mimetype) // Assumes multer provides file.buffer
  );

  try {
    const uploadResults = await Promise.all(uploadPromises);
    imagesData = uploadResults.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));
  } catch (uploadError) {
    console.error("Cloudinary upload error:", uploadError);
    res.status(500); // Internal Server Error for upload failures
    throw new Error('Image upload failed. Please ensure files are valid images and try again.');
  }
  // --- End of Image Uploads ---


  // --- Prepare Car Data for Creation ---
  const carData = {
    owner: req.user.id, // Assumes req.user is populated by auth middleware
    title,
    listingType,
    category,
    images: imagesData,
    // isAvailable defaults to true as per the schema
    // bookedDates defaults to an empty array as per the schema
  };

  // Add price field based on listingType
  if (listingType === 'rent') {
    carData.pricePerDay = numericPrice;
  } else if (listingType === 'sale') {
    carData.salePrice = numericPrice;
  }
  // Mongoose schema will validate if the correct price field (pricePerDay/salePrice) is present
  // based on the listingType.

  // Create the car in the database
  // Mongoose validation (including enums, maxlength, custom validators like arrayLimit) will run here
  const newCar = await Car.create(carData);

  res.status(201).json({ success: true, data: newCar });
});



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
