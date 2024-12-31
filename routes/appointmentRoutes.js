const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Service = require('../models/ServiceMaster'); // Your Service model
const Package = require('../models/PackageMaster'); // Your Package model
const Cart = require('../models/Cart');
const Appointment = require('../models/Appointment');
const User = require('../models/user'); // Assuming you have a User model to fetch user details
const nodemailer = require('nodemailer');
const { isAuthenticatedAndStaff } = require('../middleware/auth');

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',       // SMTP server address
  port: 587,                    // Port for STARTTLS
  secure: false, 
  auth: {
    user: 'bayleafpalcoa@gmail.com', // Your email address
    pass: 'deme ekrw mjin eeig', // Your email password (or an app-specific password if 2FA is enabled)
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates if needed (useful for testing)
  },
});

const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'bayleafpalcoa@gmail.com',  // Your email address
    to,                             // Customer's email address
    subject,                        // Subject of the email
    text,                           // The content of the email
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};


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
      user: req.session.user.userId, // Associate the appointment with the logged-in user
      status : 'Request Sent',
    });

    // Save the appointment
    const savedAppointment = await newAppointment.save();

    // Add the appointment to the user's list of appointments
    user.appointments.push(savedAppointment._id);
    await user.save();

    res.status(200).json({ message: 'Appointment booked successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error booking appointment' });
  }
});

router.get('/appointments/:id', isAuthenticatedAndStaff, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).send({ message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// Get All Appointments
router.get('/appointments', isAuthenticatedAndStaff, async (req, res) => {
  try {
    console.log('Attempting to fetch appointments from the database'); // Debug statement 2

    // Fetch appointments with populated fields
    const appointments = await Appointment.find()
      .populate({
        path: 'services',
        select: 'serviceName',
      })
      .populate({
        path: 'package',
        select: 'packageName',
      })
      .populate({
        path: 'user',
        model: 'user',
        select: 'mobile',
      })
      .exec();

    console.log('Fetched appointments successfully:'); // Debug statement 3

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error); // Add debug logging for errors
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
});

// Update Appointment
router.put('/appointments/:id', isAuthenticatedAndStaff, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { appointmentDate, appointmentTime, services, package: packageName, status } = req.body;

    console.log('Updating appointment:', { appointmentId, appointmentDate, appointmentTime, services, packageName, status });

    // Fetch the existing appointment
    const existingAppointment = await Appointment.findById(appointmentId);
    if (!existingAppointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Services: Retain existing if none are provided
    let serviceIds = existingAppointment.services;
    let serviceNames = [];
    if (services && services.length > 0) {
      // Fetch the corresponding IDs and names for service names
      const foundServices = await Service.find({ serviceName: { $in: services } }).select('_id serviceName');
      if (foundServices.length !== services.length) {
        return res.status(400).json({ message: 'Some services are invalid.' });
      }
      serviceIds = foundServices.map((service) => service._id);
      serviceNames = foundServices.map((service) => service.serviceName);
    } else {
      // Fetch service names for existing services
      const existingServices = await Service.find({ _id: { $in: existingAppointment.services } }).select('serviceName');
      serviceNames = existingServices.map((service) => service.serviceName);
    }

    // Package: Retain existing if none is provided
    const packageDoc = packageName
      ? await Package.findOne({ packageName }).select('_id packageName')
      : { _id: existingAppointment.package, packageName: 'No package selected' };
    if (packageName && !packageDoc) {
      return res.status(400).json({ message: 'Invalid package name.' });
    }

    // Status: Retain existing if none is provided
    const updatedStatus = status || existingAppointment.status;

    // Update the appointment in the database
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        appointmentDate: appointmentDate || existingAppointment.appointmentDate,
        appointmentTime: appointmentTime || existingAppointment.appointmentTime,
        services: serviceIds,
        package: packageDoc._id,
        status: updatedStatus,
      },
      { new: true } // Return the updated document
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Fetch the customer details to send an email
    const customer = await User.findById(updatedAppointment.user);
    console.log('Fetched customer:', customer);
    if (customer && customer.email) {
      // Send email to the customer
      const subject = 'Appointment Confirmation';
      const text = `Your appointment has been confirmed with the following details:
        Date: ${updatedAppointment.appointmentDate}
        Time: ${updatedAppointment.appointmentTime}
        Package: ${packageDoc.packageName}
        Services: ${serviceNames.join(', ')}`;
      console.log('Email content prepared:', { subject, text });
      sendEmail(customer.email, subject, text); // Call the function to send the email
    } else {
      console.log('No customer email found');
    }

    res.status(200).json({ message: 'Appointment updated successfully', updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/appointments/:appointmentId/assign', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { staffIds } = req.body; // Expecting an array of staff IDs

    if (!Array.isArray(staffIds) || staffIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'Invalid staff IDs' });
    }

    // Check if each staff member exists
    const staffMembers = await User.find({ _id: { $in: staffIds }, role: 'staff' });
    if (staffMembers.length !== staffIds.length) {
      return res.status(404).json({ success: false, message: 'One or more staff members not found' });
    }

    // Update the appointment with the list of staff members
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { assignedTo: staffIds },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Staff assigned successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    console.error('Error assigning staff to appointment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// GET /userrole - Fetch the role of the current user
router.get('/userRole', (req, res) => {
  try {
    console.log('Session user data:', req.session?.user); // Log session data for debugging
    const user = req.session?.user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    if (!user.role || !user.userId) {
      return res.status(400).json({ success: false, message: 'User role or ID missing' });
    }
    
    res.status(200).json({ success: true, userId: user.userId, role: user.role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ success: false, message: 'Error fetching user role' });
  }
});

// GET /staff - Fetch all staff members
router.get('/staff', async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }, { name: 1, _id: 1 }); // Fetch only staff users with name and ID
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ success: false, message: 'Error fetching staff' });
  }
});

router.get('/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
      const cart = await Cart.find({ userId });
      if (cart) {
          res.json(cart);  // Ensure the cart is an array here
      } else {
          res.status(404).json({ message: 'Cart not found' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
});

// Add to cart
router.post('/cart/add', async (req, res) => {
  try {
    const { userId, itemId, type } = req.body;

    if (!userId || !itemId || !type) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Check if a cart exists for the user
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, serviceId: [], packageId: [] });
    }

    // Add item to the appropriate field based on type
    if (type === 'service') {
      if (!cart.serviceId.includes(itemId)) {
        cart.serviceId.push(itemId);
      }
    } else if (type === 'package') {
      if (!cart.packageId.includes(itemId)) {
        cart.packageId.push(itemId);
      }
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }

    await cart.save();
    res.status(200).json({ message: 'Item added to cart', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding to cart' });
  }
});

// Remove from cart
router.post('/cart/remove', async (req, res) => {
  try {
    const { userId, itemId, type } = req.body;

    if (!userId || !itemId || !type) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Remove item from the appropriate field based on type
    if (type === 'service') {
      cart.serviceId = cart.serviceId.filter(id => id.toString() !== itemId);
    } else if (type === 'package') {
      cart.packageId = cart.packageId.filter(id => id.toString() !== itemId);
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }

    await cart.save();
    res.status(200).json({ message: 'Item removed from cart', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error removing from cart' });
  }
});
// Get Categories from ServiceMaster and PackageMaster
router.get("/categories", async (req, res) => {
  try {
    // Get distinct categories from ServiceMaster
    const serviceCategories = await Service.distinct("category");

    // Get distinct categories from PackageMaster
    const packageCategories = await Package.distinct("category");

    // Combine categories and remove duplicates
    const allCategories = [...new Set([...serviceCategories, ...packageCategories])];

    res.status(200).json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Export the router
module.exports = router;
