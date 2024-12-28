const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const router = express.Router();

// POST route to handle the signup form data
router.post('/signup', async (req, res) => {
  const { name, mobile, email, password } = req.body;

  if (!name || !mobile || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ mobile }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile or Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, mobile, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving user', error: err });
  }
});

// POST route to handle login form data
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Login route hit");
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Store user details in session
    req.session.user = {
      userId: user._id,
      name: user.name,   // Assuming the user's name is stored in the "name" field
      mobile: user.mobile // Assuming the user's mobile number is stored in the "mobile" field
    };


    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err });
  }
});

// Route to get current user session
router.get('/get-user-session', (req, res) => {
  if (req.session.user) {
      res.json({ email: req.session.user.email, userId: req.session.user.userId });
  } else {
      res.status(401).json({ message: 'No user logged in' });
  }
});


module.exports = router;
