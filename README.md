# 🚗 AutoHeaven Backend

AutoHeaven is the backend API for a car marketplace platform where users can **buy**, **sell**, or **rent** cars. It provides secure authentication, role-based access, car listing management, image handling, and admin features.

---

## 🔍 Overview

This backend is built using **Node.js**, **Express**, and **MongoDB**, following the **MVC architecture**. It supports:
- Secure login and registration with **email verification**
- **JWT-based authentication**
- Role-based access for **users**, **sellers**, and **admins**
- Cloud image upload with **Cloudinary**
- Admin control over users and car listings

---

## 🌟 Features

- **Authentication**
  - Signup with email confirmation
  - JWT Access & Refresh Tokens
  - Password hashing with bcrypt

- **Authorization & Roles**
  - Users: Browse listings
  - Sellers: Manage own car listings
  - Admins: Full control (cars, users)

- **Car Listings**
  - Create, edit, delete (with ownership check)
  - View and search/filter listings
  - Store car images using Cloudinary

- **Security**
  - CORS setup
  - Helmet for secure headers
  - Rate limiting to block brute-force attacks
  - Protected routes using `protect` and `authorize` middleware

---

## 🧰 Tech Stack

| Category       | Tools                     |
|----------------|---------------------------|
| Language       | JavaScript (ES Modules)   |
| Runtime        | Node.js                   |
| Framework      | Express.js                |
| Database       | MongoDB + Mongoose        |
| Auth           | JWT, bcrypt               |
| File Upload    | Cloudinary                |
| Email Service  | Free SMTP (e.g. Gmail)    |
| Security       | Helmet, express-rate-limit, CORS |
| Project Pattern| MVC (Model-View-Controller)|

---

## 🚀 How to Run

```bash
git clone https://github.com/yourusername/autoheaven-backend.git
cd autoheaven-backend
npm run dev
