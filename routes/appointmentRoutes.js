const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Service = require("../models/ServiceMaster"); // Your Service model
const Package = require("../models/PackageMaster"); // Your Package model
const Appointment = require("../models/Appointment");
const User = require("../models/user"); // Assuming you have a User model to fetch user details
const nodemailer = require("nodemailer");
const { isAuthenticatedAndStaff } = require("../middleware/auth");

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // SMTP server address
  port: 587, // Port for STARTTLS
  secure: false,
  auth: {
    user: "bayleafpalcoa@gmail.com", // Your email address
    pass: "deme ekrw mjin eeig", // Your email password (or an app-specific password if 2FA is enabled)
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates if needed (useful for testing)
  },
});

const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: "bayleafpalcoa@gmail.com", // Your email address
    to, // Customer's email address
    subject, // Subject of the email
    text, // The content of the email
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

router.post("/book-appointment", async (req, res) => {
  try {
    const { remarks, appointmentDate, appointmentTime, outlet, price } =
      req.body;

    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const userId = req.session.user.userId;

    // Find the existing "Carted" appointment
    const cartAppointment = await Appointment.findOne({
      user: userId,
      status: "Carted",
    });

    if (!cartAppointment) {
      return res.status(404).json({ message: "No cart appointment found" });
    }

    // Update the appointment fields and status
    cartAppointment.status = "Request Sent";
    cartAppointment.remarks = remarks;
    cartAppointment.appointmentDate = appointmentDate;
    cartAppointment.appointmentTime = appointmentTime;
    cartAppointment.outlet = outlet;
    cartAppointment.price = price;

    await cartAppointment.save();

    res.status(200).json({ message: "Appointment request sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending appointment request" });
  }
});

router.get("/appointments/:id", isAuthenticatedAndStaff, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found" });
    }
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Get All Appointments
router.get("/appointments", isAuthenticatedAndStaff, async (req, res) => {
  try {
    console.log("Attempting to fetch appointments from the database"); // Debug statement 2

    // Fetch appointments with populated fields
    const appointments = await Appointment.find()
      .populate({
        path: "services",
        select: "serviceName",
      })
      .populate({
        path: "packages",
        select: "packageName",
      })
      .populate({
        path: "user",
        model: "user",
        select: "mobile",
      })
      .exec();

    console.log("Fetched appointments successfully:"); // Debug statement 3

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error); // Add debug logging for errors
    res.status(500).json({ message: "Error fetching appointments", error });
  }
});
router.put("/appointments/:id", isAuthenticatedAndStaff, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { appointmentDate, appointmentTime, services, packages, status } =
      req.body;

    console.log("Received update for appointment:", {
      appointmentDate,
      appointmentTime,
      services,
      packages,
      status,
    });

    // Fetch the existing appointment
    const existingAppointment = await Appointment.findById(appointmentId);
    if (!existingAppointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Handle services
    let serviceIds = existingAppointment.services;
    if (services && services.length > 0) {
      const foundServices = await Service.find({
        serviceName: { $in: services },
      }).select("_id serviceName");
      console.log("Found services:", foundServices); // Log found services
      if (foundServices.length !== services.length) {
        return res.status(400).json({ message: "Some services are invalid." });
      }
      serviceIds = foundServices.map((service) => service._id);
    }

    // Handle packages
    let packageIds = existingAppointment.packages;
    if (packages && packages.length > 0) {
      const foundPackages = await Package.find({
        packageName: { $in: packages },
      }).select("_id packageName");
      console.log("Found packages:", foundPackages); // Log found packages
      if (foundPackages.length !== packages.length) {
        return res.status(400).json({ message: "Some packages are invalid." });
      }
      packageIds = foundPackages.map((pkg) => pkg._id);
    }

    // Update the appointment with the new values
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        appointmentDate: appointmentDate || existingAppointment.appointmentDate,
        appointmentTime: appointmentTime || existingAppointment.appointmentTime,
        services: serviceIds,
        packages: packageIds, // Fix for packageId typo
        status: status || existingAppointment.status,
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    res.status(200).json({
      message: "Appointment updated successfully",
      updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/appointments/:appointmentId/assign", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { staffIds } = req.body; // Expecting an array of staff IDs

    if (
      !Array.isArray(staffIds) ||
      staffIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid staff IDs" });
    }

    // Check if each staff member exists
    const staffMembers = await User.find({
      _id: { $in: staffIds },
      role: "staff",
    });
    if (staffMembers.length !== staffIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more staff members not found",
      });
    }

    // Update the appointment with the list of staff members
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { assignedTo: staffIds },
      { new: true }
    );

    if (!updatedAppointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({
      success: true,
      message: "Staff assigned successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error assigning staff to appointment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /userrole - Fetch the role of the current user
router.get("/userRole", (req, res) => {
  try {
    console.log("Session user data:", req.session?.user); // Log session data for debugging
    const user = req.session?.user;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    if (!user.role || !user.userId) {
      return res
        .status(400)
        .json({ success: false, message: "User role or ID missing" });
    }

    res
      .status(200)
      .json({ success: true, userId: user.userId, role: user.role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching user role" });
  }
});

// GET /staff - Fetch all staff members
router.get("/staff", async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }, { name: 1, _id: 1 }); // Fetch only staff users with name and ID
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ success: false, message: "Error fetching staff" });
  }
});

// Replace your existing GET /cart/:userId with this

router.get("/cart/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Appointment.findOne({ user: userId, status: "Carted" })
      .populate("services.service") // populate services
      .populate("packages.package") // populate packages
      .populate("packages.services.service"); // if you want package-internal services populated

    if (cart) {
      res.json(cart);
    } else {
      res.status(404).json({ message: "Cart not found" });
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/cart/add", async (req, res) => {
  try {
    const { userId, itemId, type } = req.body;

    if (!userId || !itemId || !type) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    let cart = await Appointment.findOne({ user: userId, status: "Carted" });

    if (!cart) {
      // Fetch user details to fill in the appointment
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      cart = new Appointment({
        user: userId,
        services: [],
        packages: [],
        status: "Carted",
        appointmentDate: new Date(), // Temporary placeholder
        appointmentTime: "00:00", // Temporary placeholder
        outlet: "000000000000000000000000", // Placeholder - replace as needed
        customerName: user.name,
        customerMobile: user.mobile,
        gender: "Female", // Default; update if you plan to store gender in User
        price: 0,
      });
    }

    // Add service or package
    if (type === "service") {
      const alreadyExists = cart.services.some(
        (s) => s.service.toString() === itemId
      );
      if (!alreadyExists) {
        cart.services.push({ service: itemId });
      }
    } else if (type === "package") {
      const alreadyExists = cart.packages.some(
        (p) => p.package.toString() === itemId
      );
      if (!alreadyExists) {
        cart.packages.push({ package: itemId, services: [] });
      }
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

router.post("/cart/remove", async (req, res) => {
  try {
    const { userId, itemId, type } = req.body;

    if (!userId || !itemId || !type) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const cart = await Appointment.findOne({ user: userId, status: "Carted" });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (type === "service") {
      cart.services = cart.services.filter(
        (s) => s.service.toString() !== itemId
      );
    } else if (type === "package") {
      cart.packages = cart.packages.filter(
        (p) => p.package.toString() !== itemId
      );
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    await cart.save();
    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing from cart" });
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
    const allCategories = [
      ...new Set([...serviceCategories, ...packageCategories]),
    ];

    res.status(200).json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/users/:userId/appointments", async (req, res) => {
  const { userId } = req.params;

  try {
    const userAppointments = await Appointment.find({ user: userId })
      .populate("services.service", "serviceName")
      .populate("packages.package", "packageName")
      .populate("packages.services.service", "serviceName"); // populate nested services in packages

    if (!userAppointments.length) {
      return res
        .status(404)
        .json({ error: "No appointments found for this user" });
    }

    res.json(userAppointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});
// Export the router
module.exports = router;
