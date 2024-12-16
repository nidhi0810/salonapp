const express = require('express');
const router = express.Router();

const Appointment = require('../models/Appointment');
const Service = require('../models/ServiceMaster');
const Package = require('../models/PackageMaster');
const Outlet = require('../models/OutletMaster');
const User = require('../models/user'); // Assuming you have a User model to fetch user details

// Route to book an appointment
router.post('/book-appointment', async (req, res) => {
  try {
    const { services, package, remarks, appointmentDate, appointmentTime, outlet, price} = req.body;

    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ message: 'User not logged in' });
    }

    // Fetch user details from the database using the userId from session
    const user = await User.findById(req.session.user.userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Get customer details from user (assuming name and mobile are in user document)
    const customerName = user.name;
    const customerMobile = user.mobile;

    // Calculate the price
    const serviceObjects = await Service.find({ '_id': { $in: services } });
    const packageObject = package ? await Package.findById(package) : null;

    // Create a new appointment
    const newAppointment = new Appointment({
      customerName,
      customerMobile,
      services,
      package,
      remarks,
      appointmentDate,
      appointmentTime,
      outlet,
      price,
      user: req.session.user.userId // Associate the appointment with the logged-in user
    });

    // Save the appointment
    await newAppointment.save();

    res.status(200).json({ message: 'Appointment booked successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error booking appointment' });
  }
});

// Export the router
module.exports = router;
