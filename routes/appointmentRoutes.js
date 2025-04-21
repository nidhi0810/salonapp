const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Service = require("../models/ServiceMaster"); // Your Service model
const Package = require("../models/PackageMaster"); // Your Package model
const Appointment = require("../models/Appointment");
const User = require("../models/user"); // Assuming you have a User model to fetch user details
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

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
    console.log(remarks, appointmentDate, appointmentTime, outlet, price);
    const userId = req.session.user.userId;

    // Find the existing "Carted" appointment
    const cartAppointment = await Appointment.findOne({
      user: userId,
      status: "Carted",
    });

    if (!cartAppointment) {
      return res.status(404).json({ message: "No cart appointment found" });
    }

    // Update appointment fields and status
    cartAppointment.status = "Request Sent";
    cartAppointment.remarks = remarks;
    cartAppointment.appointmentDate = appointmentDate;
    cartAppointment.appointmentTime = appointmentTime;
    cartAppointment.outlet = outlet;
    cartAppointment.price = price;

    await cartAppointment.save();

    // Fetch user email and name
    const user = await User.findById(userId); // Assuming you have a User model
    if (user && user.email) {
      const subject = "BayLeaf Salon - Appointment Confirmation";
      const message = `
Hi ${user.name || "Customer"},

Your appointment request has been successfully received.

📅 Date: ${appointmentDate}
⏰ Time: ${appointmentTime}
🏢 Outlet: ${outlet}
💬 Remarks: ${remarks}
💰 Price: ₹${price}

Thank you for choosing BayLeaf Salon!
We look forward to seeing you. 💇‍♀️✨
`;

      sendEmail(user.email, subject, message);
    }

    res.status(200).json({ message: "Appointment request sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending appointment request" });
  }
});

router.get("/appointments/:id", async (req, res) => {
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

router.put("/appointments/:id", async (req, res) => {
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
      cart.services = cart.services.filter((s) => s._id.toString() !== itemId);
    } else if (type === "package") {
      cart.packages = cart.packages.filter((p) => p._id.toString() !== itemId);
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
    const userAppointments = await Appointment.find({
      user: userId,
      status: { $ne: "Carted" },
    })
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

// GET /appointments - returns all appointments with populated data
router.get("/appointments", async (req, res) => {
  try {
    const currentUser = req.user;

    // Get all appointments with deep population
    let appointments = await Appointment.find()
      .populate("user", "mobile name")
      .populate("services.service", "serviceName")
      .populate("packages.package", "packageName")
      .populate("packages.services.service", "serviceName");

    // If role is staff, only show appointments assigned to them
    if (currentUser && currentUser.role === "staff") {
      appointments = appointments.filter((appt) =>
        appt.assignedTo.some(
          (staffId) => staffId.toString() === currentUser._id.toString()
        )
      );
    }

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error loading appointments:", error);
    res.status(500).json({ error: "Failed to load appointments" });
  }
});

router.post("/appointments/cancel/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cancelling appointment" });
  }
});

// In-memory token store (use Redis or DB in prod)
const resetTokens = new Map();

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 15 * 60 * 1000; // 15 mins

  resetTokens.set(token, { email, expiry });

  const resetLink = `https://bayleaf.onrender.com/reset-password?token=${token}`;

  sendEmail(
    email,
    "Password Reset",
    `Click the following link to reset your password: ${resetLink}`
  );

  res.json({ message: "Reset link sent to your email." });
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  const data = resetTokens.get(token);
  if (!data || data.expiry < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired token." });
  }

  const user = await User.findOne({ email: data.email });
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  resetTokens.delete(token);

  res.json({ message: "Password has been reset successfully." });
});
// Export the router
module.exports = router;
