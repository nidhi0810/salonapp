const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const router = require('./routes/authRoutes');  
const outletRoutes = require('./routes/outletRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const packageRoutes = require('./routes/packageRoutes');
const appointmentRouter = require('./routes/appointmentRoutes');

const app = express();

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

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/salon', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB', err);
  });

// Use routes
app.use('/auth', router);
app.use('/outlets', outletRoutes);
app.use('/services', serviceRoutes);
app.use('/packages', packageRoutes);
app.use(appointmentRouter); // Ensure it's set correctly

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'appointment.html'));
});
// Serve login page at /login route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
