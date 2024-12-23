const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Service = require('../models/ServiceMaster'); // Your Service model
const Package = require('../models/PackageMaster'); // Your Package model
const Appointment = require('../models/Appointment');
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
    await newAppointment.save();

    res.status(200).json({ message: 'Appointment booked successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error booking appointment' });
  }
});

router.get('/appointments/:id', async (req, res) => {
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
router.get('/appointments', async (req, res) => {
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
        model: 'customerdetails',
        select: 'mobile',
      })
      .exec();

    console.log('Fetched appointments successfully:', appointments); // Debug statement 3

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error); // Add debug logging for errors
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
});

// Update Appointment
router.put('/appointments/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { appointmentDate, appointmentTime, services, package: packageName, status } = req.body;

    //console.log('Updating appointment:', { appointmentId, appointmentDate, appointmentTime, services, packageName, status });

    // Fetch the existing appointment
    const existingAppointment = await Appointment.findById(appointmentId);
    if (!existingAppointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Retain existing services if none are provided
    let serviceIds = existingAppointment.services;
    if (services && services.length > 0) {
      // Fetch the corresponding IDs for service names
      const foundServices = await Service.find({ serviceName: { $in: services } }).select('_id');
      if (foundServices.length !== services.length) {
        return res.status(400).json({ message: 'Some services are invalid.' });
      }
      serviceIds = foundServices.map((service) => service._id);
    }

    // Retain existing package if none is provided
    const packageDoc = packageName
      ? await Package.findOne({ packageName }).select('_id')
      : existingAppointment.package;
    if (packageName && !packageDoc) {
      return res.status(400).json({ message: 'Invalid package name.' });
    }

    // Update the appointment in the database
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        appointmentDate: appointmentDate || existingAppointment.appointmentDate,
        appointmentTime: appointmentTime || existingAppointment.appointmentTime,
        services: serviceIds,
        package: packageDoc._id || existingAppointment.package,
        status: status || existingAppointment.status,
      },
      { new: true } // Return the updated document
    );

    res.status(200).json({ message: 'Appointment updated successfully', updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an Appointment
router.delete('/appointments/:id', async (req, res) => {
  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!deletedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting appointment', error });
  }
});


// Export the router
module.exports = router;
