import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Middleware to verify token and set req.user
export const protect = asyncHandler(async (req, res, next) => {
  const accessToken = req.headers.authorization?.split(" ")[1]; // Getting token from cookies

  if (!accessToken) {
    res.status(401);
    throw new Error("Not authorized, no access token");
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = await User.findById(decoded.id).select("-password"); // Attach user to request
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, Invalid or expired access token");
  }
});

// Middleware to check user role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("Not authorized for this action");
    }
    next();
  };
};
