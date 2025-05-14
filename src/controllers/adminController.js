import asyncHandler from "express-async-handler";
import User from "../models/User.js";


// @desc   Get all users
// @route  GET /api/admin/users
// @access Admin
export const getAllUsers = asyncHandler(async (req, res) =>{
    const users = await User.find().select("-password -refreshToken");
    res.status(200).json(users)
});


// @desc   Delete a user
// @route  DELETE /api/admin/users/:id
// @access Admin
export const deleteUser = asyncHandler(async (req, res) =>{
    const user = await User.findById(req.params.id);

    if(!user){
        res.status(404);
        throw new Error("User not found");
    }

    await user.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });
});


// @desc   Update user role
// @route  PUT /api/admin/users/:id/role
// @access Admin
export const updateUserRole = asyncHandler(async (req, res) =>{
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if(!user){
        res.status(404);
        throw new Error("user not found");
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: "User role updated", user });
})


