const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const MongoStore = require("connect-mongo");
const passport = require("passport");

const connectDB = require("./config/db"); // Import your DB connection
const router = require("./routes/authRoutes");
const carouselRoutes = require("./routes/carouselRoutes");
const staffRoutes = require("./routes/staffRoutes");
const outletRoutes = require("./routes/outletRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const packageRoutes = require("./routes/packageRoutes");
const appointmentRouter = require("./routes/appointmentRoutes");

// Initialize Express app
const app = express();

// Set the view engine to EJS
app.set("view engine", "ejs");
// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Connect to MongoDB
connectDB(); // Make sure the connection is established before the server starts

// Enable CORS for specific domain
const allowedOrigins = [
  "http://localhost:5000",
  "https://bayleaf.onrender.com",
]; // Replace with your actual domain

// Middleware to parse JSON data
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS")); // Reject the request
    }
  },
  credentials: true, // Make sure cookies are sent with requests
};

// Use CORS middleware
app.use(cors(corsOptions));

// middleware
app.use(passport.initialize());

// Session middleware using MongoDB Atlas URI
app.use(
  session({
    secret: "your-secret-key", // Use a strong secret for production
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://nidhiputhrannp:nid081005@cluster0.yuoi5.mongodb.net/salon?retryWrites=true&w=majority", // MongoDB Atlas URI
      ttl: 14 * 24 * 60 * 60, // Set session expiration (14 days)
    }),
    cookie: {
      httpOnly: true,
      secure: false, // Set to `true` if using HTTPS in production
    },
  })
);

// Google Sign-In route
/* app.post('/auth/google', googleLogin);
 */

// Serve static files (HTML, CSS, JS)
app.use("/uploads", express.static("uploads"));

// Use routes
app.use("/auth", router);
app.use("/api/carousel", carouselRoutes);
app.use("/auth/staff", staffRoutes);
app.use("/api/outlets", outletRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api", appointmentRouter); // Ensure it's set correctly

// Endpoint to serve the Firebase config
app.get("/firebaseConfig.js", async (req, res) => {
  try {
    const firebaseConfig = await import("./config/firebaseConfig.mjs"); // Dynamic import for .mjs file
    res.type("application/javascript"); // Set the correct MIME type for JS
    res.send(firebaseConfig.default); // Send the content of the firebaseConfig file
  } catch (err) {
    console.error("Error serving firebase config:", err);
    res.status(500).send("Error loading firebase config");
  }
});

app.get("/", (req, res) => {
  res.render("home"); // Renders the main view
});
app.get("/book-appointment", (req, res) => {
  res.render("bookappointment");
});

// Serve login page at /login route
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/signup", (req, res) => {
  res.render("signup");
});
// Serve login page at /login route
app.get("/stafflogin", (req, res) => {
  res.render("stafflogin");
});
app.get("/staffsignup", (req, res) => {
  res.render("staffsignup");
});
app.get("/appointmentvalidation", (req, res) => {
  res.render("appointmentvalidation");
});
app.get("/services", (req, res) => {
  res.render("services"); // Renders the main view
});
app.get("/cart", (req, res) => {
  res.render("cart"); // Renders the main view
});
app.get("/profile", (req, res) => {
  res.render("editProfile"); // Renders the main view
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
