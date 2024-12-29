// middleware/auth.js

const User = require('../models/user'); // Assuming the user model is here

// Middleware to check if the user is logged in and has the "staff" role
const isAuthenticatedAndStaff = async (req, res, next) => {
  try {
    console.log("initiating middleware");
    // Check if the user is logged in (assuming user ID is stored in the session)
    if (!req.session.user || !req.session.user.userId) {
        console.log("Redirect to login page if not logged in");
        return res.redirect('http://localhost:5000/stafflogin');  // Redirect to login page if not logged in
    }

    // Fetch user details from the database using the userId stored in session
    const user = await User.findById(req.session.user.userId);
    
    // Check if the user exists and if their role is "staff"
    if (!user || user.role === 'customer') {
        console.log("Redirect to login page if not staff");
        return res.redirect('http://localhost:5000/stafflogin');  // Redirect to login page if not logged in
    }

    // If user is authenticated and has staff role, continue with the next middleware or route handler
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = { isAuthenticatedAndStaff };
