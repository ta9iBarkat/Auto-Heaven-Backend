import CarListing from '../models/Car.js';
import asyncHandler from "express-async-handler";


// @route   PUT /api/cars
export const createCar = asyncHandler(async (req, res) => {
  
  const {
    title,
    description,
    price,
    brand,
    model,
    year,
    condition,
    type,
    isForSale,
    isForRent,
    images,
  } = req.body;

  if (!title || !price || !brand || !model || !year || !condition) {
    res.status(400);
    throw new Error("Please provide all required fields.");
  }

  const newListing = await CarListing.create({
    title,
    description,
    price,
    brand,
    model,
    year,
    condition,
    type,
    isForSale,
    isForRent,
    isAvailable: true,
    images,
    sellerId: req.user._id, // assuming the user is authenticated
  });

  res.status(201).json(newListing);
});



// @desc    Update a car by ID
// @route   PUT /api/cars/:id
// @access  Private (Admin or owner)
export const updateCar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const car = await CarListing.findById(id);

  if (!car) {
    res.status(404);
    throw new Error("Car not found");
  }

  // Optional: check if current user is the owner or admin
  if (req.user.id != car.sellerId.toString() ) {
    res.status(403);
    throw new Error("Not authorized to update this car");
  }

  const updatedCar = await CarListing.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(updatedCar);
});



// @desc    Delete a car by ID
// @route   DELETE /api/cars/:id
// @access  Private (Admin only or owner maybe)
export const deleteCar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const car = await CarListing.findById(id);

  if (!car) {
    res.status(404);
    throw new Error("Car not found");
  }

  // Optional: Check ownership
  console.log(car.sellerId.toString())
  console.log(req.user.id)
  if (req.user.role != "admin" && req.user.id !== car.sellerId.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this car");
  }

  await car.deleteOne();

  res.status(200).json({ message: "Car deleted successfully" });
});

