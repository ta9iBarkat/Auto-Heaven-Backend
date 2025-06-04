# 🚗 AutoHeaven Backend

AutoHeaven is a full-featured backend API for a car marketplace platform where users can buy, sell, or rent vehicles. Built with **Express.js** and **MongoDB**, it offers secure authentication, image upload via Cloudinary, and role-based access for users, sellers, and admins.

---

## 🌟 Features

- **User Authentication**  
  - JWT-based login & signup  
  - Email verification via a free email service  
  - Access & refresh token system

- **Role-Based Access**  
  - Users: Browse car listings  
  - Sellers: Create, update, and delete their own listings  
  - Admins: Full access to manage cars and users

- **Car Listings**  
  - CRUD operations for car listings  
  - Filter & search cars  
  - Image upload to Cloudinary (with `public_id` tracking)

- **Security**  
  - CORS configuration  
  - Helmet for secure HTTP headers  
  - Rate limiting to prevent brute-force attacks  
  - Route protection and authorization middleware

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js  
- **Database**: MongoDB & Mongoose  
- **Auth**: JWT, bcrypt  
- **Image Upload**: Cloudinary  
- **Security**: Helmet, express-rate-limit, CORS

---
