const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const connectDB = require('./config/db'); // Import your DB connection
const router = require('./routes/authRoutes'); 
const staffRoutes = require('./routes/staffRoutes');  
const outletRoutes = require('./routes/outletRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const packageRoutes = require('./routes/packageRoutes');
const appointmentRouter = require('./routes/appointmentRoutes');

const app = express();

// Connect to MongoDB
connectDB();  // Make sure the connection is established before the server starts

// Enable CORS for specific domain
const allowedOrigins = [
    'http://localhost:5000',
    'https://bayleaf.onrender.com']; // Replace with your actual domain

// Middleware to parse JSON data
app.use(bodyParser.json());
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);  // Allow the request
    } else {
      callback(new Error('Not allowed by CORS'));  // Reject the request
    }
  },
  credentials: true  // Make sure cookies are sent with requests
};

// Use CORS middleware
app.use(cors(corsOptions));

// Session middleware
app.use(session({
  secret: 'your-secret-key', // Use a strong secret for production
  resave: false,
  saveUninitialized: true,
  cookie: { httpOnly: true, secure: true } // Set `secure: true` in production (with HTTPS)
}));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Use routes
app.use('/auth', router);
app.use('/auth/staff', staffRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api', appointmentRouter); // Ensure it's set correctly

app.get('/book-appointment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bookappointment.html'));
});
// Serve login page at /login route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});
// Serve login page at /login route
app.get('/stafflogin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stafflogin.html'));
});
app.get('/staffsignup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staffsignup.html'));
});
app.get('/appointmentvalidation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'appointmentvalidation.html'));
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
