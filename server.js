const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const connectDB = require('./config/db'); // Import your DB connection
const router = require('./routes/authRoutes');  
const outletRoutes = require('./routes/outletRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const packageRoutes = require('./routes/packageRoutes');
const appointmentRouter = require('./routes/appointmentRoutes');

const app = express();

// Connect to MongoDB
connectDB();  // Make sure the connection is established before the server starts

// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(cors());  // Enable CORS for cross-origin requests

// Session middleware
app.use(session({
  secret: 'your-secret-key', // Use a strong secret for production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set `secure: true` in production (with HTTPS)
}));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Use routes
app.use('/auth', router);
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
app.get('/appointmentvalidation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'appointmentvalidation.html'));
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
