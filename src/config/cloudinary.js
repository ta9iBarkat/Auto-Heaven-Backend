import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

// access to cloudinary account 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const cloudinaryUpload = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        
        if (error) return reject(error);

        resolve(result);
      }
    );

    stream.end(buffer); // send the buffer to Cloudinary
  });
};


// Create a Cloudinary storage engine
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "autoheaven_cars", // folder in your cloudinary dashboard
      allowed_formats: ["jpg", "jpeg", "png"],
      transformation: [{ width: 800, height: 600, crop: "limit" }],
    },
  });
  
export { cloudinary, storage, cloudinaryUpload };
