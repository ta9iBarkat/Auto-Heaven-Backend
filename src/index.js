import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import Cors from "./config/Cors.js"; 
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import securityMiddleware from "./middleware/security.js";
import globalLimiter from "./middleware/rateLimiter.js"

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser()); 
app.use(Cors); 
app.use(securityMiddleware);
app.use(globalLimiter);


connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
