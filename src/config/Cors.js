import cors from "cors";

let Cors = cors({
  origin: (origin, callback) => {
    let allowedOrigins = ["http://localhost:5173", "http://www.google.com"];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow request
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies and JWT in requests
});

export default Cors;
