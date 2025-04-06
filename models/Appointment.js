const mongoose = require("mongoose");

// Define the schema for an appointment
const appointmentSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    customerMobile: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v); // Validates mobile number (10 digits)
        },
        message: "Invalid mobile number",
      },
    },
    gender: {
      type: String,
      default: "Female",
      enum: ["Male", "Female", "Other"],
    },
    // Services directly booked in the appointment
    services: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ServiceMaster", // Reference to the Service model
          required: true,
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Staff assigned to this service
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Admin who assigned the staff
        },
        completedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Staff who completed the service
        },
        status: {
          type: String,
          enum: ["Assigned", "In Progress", "Completed", "Cancelled"],
          default: "Assigned",
        },
        remarks: {
          type: String, // Any remarks specific to this service
        },
      },
    ],
    // Packages booked in the appointment
    packages: [
      {
        package: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PackageMaster", // Reference to the Package model
          required: true,
        },
        services: [
          {
            service: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "ServiceMaster", // Reference to the Service model within the package
              required: true,
            },
            assignedTo: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User", // Staff assigned to this service
            },
            assignedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User", // Admin who assigned the staff
            },
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User", // Staff who completed the service
            },
            status: {
              type: String,
              enum: ["Assigned", "In Progress", "Completed", "Cancelled"],
              default: "Assigned",
            },
            remarks: {
              type: String, // Any remarks specific to this service
            },
          },
        ],
        status: {
          type: String,
          enum: ["Assigned", "In Progress", "Completed", "Cancelled"],
          default: "Assigned", // Status of the entire package
        },
        remarks: {
          type: String, // Any remarks for the package as a whole
        },
      },
    ],
    remarks: {
      type: String,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    sourceOfAppointment: {
      type: String,
      enum: ["Call", "SMS", "Whatsapp"],
    },
    outlet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Outlet",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Carted",
        "Request Sent",
        "Confirmed",
        "Cancelled",
        "Did Not Turn Up",
        "Partially Completed",
        "All Completed",
        "Overdue",
      ],
      default: "Carted",
    },
  },
  { timestamps: true }
);

// Create the model from the schema
const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
