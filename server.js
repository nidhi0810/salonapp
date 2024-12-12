const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

// Import the existing User model
const User = require('./models/user');  // Import your existing User model

const app = express();

// Middleware to parse JSON data
app.use(bodyParser.json());

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

// Serve the signup page when visiting /signup (GET request)
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));  // Replace 'signup.html' with the path to your HTML file
});

// POST route to handle the signup form data
app.post('/signup', async (req, res) => {
  const { name, mobile, email, password } = req.body;

  // Simple validation for required fields
  if (!name || !mobile || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the mobile or email already exists in the database
    const existingUser = await User.findOne({ $or: [{ mobile }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile or Email already exists' });
    }

    // Hash the password using bcrypt before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user using your existing User model
    const user = new User({ name, mobile, email, password:hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving user', error: err });
  }
});


// Serve the login page when visiting /login (GET request)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));  // Replace 'login.html' with the path to your HTML file
  });
  
  // POST route to handle login form data
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
  
      // Compare password with the stored hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Successful login
      res.status(200).json({ message: 'Login successful' });
    } catch (err) {
      res.status(500).json({ message: 'Error logging in', error: err });
    }
  });
  
// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
