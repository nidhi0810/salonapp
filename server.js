const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const MongoStore = require('connect-mongo');

const connectDB = require('./config/db'); // Import your DB connection
const router = require('./routes/authRoutes'); 
const carouselRoutes = require('./routes/carouselRoutes');
const staffRoutes = require('./routes/staffRoutes');  
const outletRoutes = require('./routes/outletRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const packageRoutes = require('./routes/packageRoutes');
const appointmentRouter = require('./routes/appointmentRoutes');

const { OAuth2Client } = require('google-auth-library');
// Replace with your actual client ID and client secret
const client = new OAuth2Client('537627452553-uj06b6kr62ka99rb7m53rarlsdftg38n.apps.googleusercontent.com');

// Initialize Express app
const app = express();


// Connect to MongoDB
connectDB();  // Make sure the connection is established before the server starts

// Enable CORS for specific domain
const allowedOrigins = [
    'http://localhost:5000',
    'https://bayleaf.onrender.com']; // Replace with your actual domain

// Middleware to parse JSON data
app.use(express.urlencoded({ extended: true }));
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

// Session middleware using MongoDB Atlas URI
app.use(session({
  secret: 'your-secret-key',  // Use a strong secret for production
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://nidhiputhrannp:nid081005@cluster0.yuoi5.mongodb.net/salon?retryWrites=true&w=majority',  // MongoDB Atlas URI
    ttl: 14 * 24 * 60 * 60,  // Set session expiration (14 days)
  }),
  cookie: { 
    httpOnly: true, 
    secure: false,  // Set to `true` if using HTTPS in production
  },
}));


// Route to handle Google Sign-In token verification
app.post('/google-login', async (req, res) => {
  const { token, email, mobile } = req.body;
  
  try {
      // Verify the Google ID token using your client ID
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: '537627452553-uj06b6kr62ka99rb7m53rarlsdftg38n.apps.googleusercontent.com', // Google Client ID from your JSON
      });

      const payload = ticket.getPayload();
      console.log('Verified payload:', payload);
      
      // Store user information in session
      req.session.user = {
          email: email,
          mobile: mobile,
          name: payload.name,
          googleId: payload.sub
      };

      res.json({ message: 'User logged in successfully', user: req.session.user });
  } catch (error) {
      console.error('Error verifying token:', error);
      res.status(400).json({ error: 'Invalid token or other error' });
  }
});

// Route to display the dashboard (only accessible when logged in)
app.get('/dashboard', (req, res) => {
  if (req.session.user) {
      res.json({ message: 'Welcome to your dashboard', user: req.session.user });
  } else {
      res.status(401).json({ error: 'You need to login first' });
  }
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static("uploads"));

// Use routes
app.use('/auth', router);
app.use('/api/carousel', carouselRoutes);
app.use('/auth/staff', staffRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api', appointmentRouter); // Ensure it's set correctly


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});
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
