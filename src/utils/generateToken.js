import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },  // Payload
    process.env.ACCESS_TOKEN_SECRET,   // Secret Key
    { expiresIn: "15m" }               // Expiry time
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },                   // Payload
    process.env.REFRESH_TOKEN_SECRET,   // Secret Key
    { expiresIn: "7d" }                 // Expiry time
  );
};
