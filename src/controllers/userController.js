import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});


// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Update only provided fields
  user.name = req.body.name || user.name;
  user.surname = req.body.surname || user.surname;
  user.email = req.body.email || user.email;
  user.contactDetails = req.body.contactDetails || user.contactDetails;

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    surname: updatedUser.surname,
    email: updatedUser.email,
    contactDetails: updatedUser.contactDetails,
    role: updatedUser.role,
    message: "Profile updated successfully",
  });
});
