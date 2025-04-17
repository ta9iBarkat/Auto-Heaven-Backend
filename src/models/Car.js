import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
    {
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  images: [{ type: String }], // URLs of images
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: String, required: true },
  condition: { type: String, required: true },
  type: { type: String, enum: ["sedan", "SUV", "truck", "coupe", "other"], required: true },
  isForSale: { type: Boolean, default: false },
  isForRent: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
    }
  },{ timestamps: true });

const Car = mongoose.model("CarListing", carSchema);

export default Car;
