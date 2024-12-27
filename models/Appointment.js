const mongoose = require('mongoose');

// Define the schema for an appointment
const appointmentSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  customerMobile: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v); // Validates mobile number (10 digits)
      },
      message: 'Invalid mobile number',
    },
  },
  gender: {
    type: String,
    default: 'Female', // Default value as per your requirement
    enum: ['Male', 'Female', 'Other'], // Possible values for gender
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceMaster', // Reference to the Service model
  }],
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackageMaster', // Reference to the Package model
  },
  remarks: {
    type: String,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true, // You can store time as string in 'HH:mm' format
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sourceOfAppointment: {
    type: String,
    enum: ['Call', 'SMS', 'Whatsapp'], // Appointment source
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet', // Reference to the Outlet model
    required: true, // Default outlet can be assigned or selected by user
  },
  price: {
    type: Number,
    required: true, // Price of the appointment (this can be calculated dynamically)
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true, // Store user who made the appointment
  },
  status: {
    type: String,
    enum: [
      'Request Sent', // Not confirmed
      'Confirmed', // Once the Outlet staff confirms
      'Cancelled', // If Customer or Backend Outlet staff cancels
      'Did Not Turn Up', // To be updated by backend staff
      'Partially Completed', // To be updated by backend staff
      'All Completed', // To be updated by backend staff
      'Overdue', // System updates if the appointment passes the time
    ],
    default: 'Request Sent',
  },
}, { timestamps: true });

// Create the model from the schema
const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
