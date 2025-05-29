import asyncHandler from 'express-async-handler';
import Car from '../models/Car.js'; // Ensure path is correct
import { cloudinaryUpload , cloudinary } from '../config/cloudinary.js'; // Ensure path is correct

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
      return next(new Error(`Car not found with id ${req.params.id}`, 404));
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
      return next(new Error(`Car not found with id ${req.params.id}`, 404));
    }

    // Verify ownership
    if (car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new Error(`Not authorized to update this car`, 401));
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// @desc    Delete car and its associated images from Cloudinary
// @route   DELETE /api/cars/:id
// @access  Private (Owner or Admin)
export const deleteCar = asyncHandler(async (req, res, next) => {
  const car = await Car.findById(req.params.id);

  if (!car) {
    return next(new Error(`Car not found with id ${req.params.id}`, 404));
  }

  // Verify ownership or admin role
  // Assuming req.user.id and req.user.role are populated by auth middleware
  if (car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new Error(`User ${req.user.id} is not authorized to delete this car`, 401));
  }

  // Delete images from Cloudinary
  if (car.images && car.images.length > 0) {
    const deletionPromises = car.images.map(image => {
      // cloudinary.uploader.destroy returns a promise if no callback is provided
      return cloudinary.uploader.destroy(image.public_id);
    });

    try {
      const deletionResults = await Promise.all(deletionPromises);
      // Optional: Log results or check for specific errors from Cloudinary
      deletionResults.forEach(result => {
        if (result.result !== 'ok' && result.result !== 'not found') {
          // 'not found' can be considered a success if the image was already deleted
          console.warn(`Cloudinary: Failed to delete image ${result.public_id_str || 'unknown'}: ${result.result}`);
        }
      });
    } catch (cloudinaryError) {
      // Log the error, but still proceed to delete the car from DB
      // You might choose a different strategy, e.g., not deleting the car if Cloudinary fails.
      console.error('Error deleting images from Cloudinary:', cloudinaryError);
      // Optionally, you could return an error here if Cloudinary deletion is critical
      // return next(new Error('Failed to delete associated images from cloud.', 500));
    }
  }

  // Delete car from database
  await car.deleteOne(); // Mongoose v6+ preferred way. For older versions: await car.remove();

  res.status(200).json({ success: true, data: {}, message: 'Car and associated images deleted successfully.' });
});

// @desc    Delete a specific image of a car from Cloudinary and DB
// @route   DELETE /api/cars/:carId/images/:publicId
// @access  Private (Owner or Admin)
export const deleteCarImage = asyncHandler(async (req, res, next) => {
  const { carId, publicId } = req.params;

  if (!publicId) {
    return next(new Error('Image public_id is required.', 400));
  }

  const car = await Car.findById(carId);

  if (!car) {
    return next(new Error(`Car not found with id ${carId}`, 404));
  }

  // Verify ownership or admin role
  if (car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new Error(`User ${req.user.id} is not authorized to modify this car's images`, 401));
  }

  // Find the image in the car's images array
  const imageIndex = car.images.findIndex(img => img.public_id === publicId);

  if (imageIndex === -1) {
    return next(new Error(`Image with public_id ${publicId} not found for this car.`, 404));
  }

  // --- Business Rule: Prevent deleting the last image ---
  // Your CarSchema has: validate: [arrayLimit, '{PATH} must contain at least 1 image']
  // This validation applies on creation/update. If you want to enforce it strictly
  // even for partial updates like deleting an image, add this check:
  if (car.images.length === 1) {
    return next(new Error('Cannot delete the last image. A car must have at least one image.', 400));
  }
  // --- End of Business Rule ---

  // Delete from Cloudinary
  try {
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
    if (cloudinaryResult.result !== 'ok' && cloudinaryResult.result !== 'not found') {
      // Log or handle if Cloudinary deletion fails but image might still be in DB
      console.warn(`Cloudinary: Failed to delete image ${publicId}: ${cloudinaryResult.result}`);
      // Depending on strictness, you might return an error here
      // return next(new Error(`Failed to delete image ${publicId} from cloud.`, 500));
    }
  } catch (cloudinaryError) {
    console.error(`Error deleting image ${publicId} from Cloudinary:`, cloudinaryError);
    return next(new Error(`Error deleting image ${publicId} from cloud. Please try again.`, 500));
  }

  // Remove image reference from car document in DB
  car.images.splice(imageIndex, 1); // Remove the image from the array
  // Or using Mongoose's $pull, which can be more atomic in some cases:
  // await Car.updateOne({ _id: carId }, { $pull: { images: { public_id: publicId } } });
  // However, since we already fetched the 'car' document and might have other changes,
  // modifying the array and then saving is common.

  await car.save();

  res.status(200).json({
    success: true,
    message: `Image ${publicId} deleted successfully.`,
    data: car // Return the updated car object
  });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// // @desc    Delete car
// // @route   DELETE /api/cars/:id
// export const deleteCar = async (req, res, next) => {
//   try {
//     const car = await Car.findById(req.params.id);

//     if (!car) {
//       return next(new Error(`Car not found with id ${req.params.id}`, 404));
//     }

//     // Verify ownership
//     if (car.owner.toString() !== req.user.id && req.user.role !== 'admin') {
//       return next(new Error(`Not authorized to delete this car`, 401));
//     }

//     await car.remove();
//     res.status(200).json({ success: true, data: {} });
//   } catch (err) {
//     next(err);
//   }
// };






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
      return next(new Error(`Car not found with id ${req.params.id}`, 404));
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
