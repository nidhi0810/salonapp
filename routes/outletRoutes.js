// routes/outletRoutes.js
const express = require("express");
const router = express.Router();
const Outlet = require("../models/OutletMaster"); // Import the Outlet model
const Appointment = require("../models/Appointment");
const User = require("../models/user");

router.get("/", async (req, res) => {
  try {
    const outlets = await Outlet.find();

    const outletData = outlets.map((outlet) => {
      const fullAddress = [
        outlet.address1,
        outlet.address2,
        outlet.address3,
        outlet.landmark,
        outlet.city,
        outlet.state,
        outlet.pincode,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        id: outlet._id,
        name: outlet.outletName,
        fullAddress,
        googleMapLink: outlet.googleMapLink,
      };
    });

    res.json({ data: outletData });
  } catch (error) {
    console.error("Error fetching outlets:", error); // Log the actual error
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
});

router.get("/appointments", async (req, res) => {
  try {
    console.log("➡️  Incoming GET /appointments request");

    // Check session and user
    if (!req.session || !req.session.user) {
      console.warn("❌ No session or user found in session.");
      return res
        .status(401)
        .json({ error: "Unauthorized: No session or user." });
    }

    const userId = req.session.user.userId;
    console.log("👤 Logged-in User ID:", userId);

    // Fetch user with outlet populated
    const user = await User.findById(userId).populate("outlet");
    console.log("📦 Populated User:", user);

    if (!user || !user.outlet) {
      console.warn("❌ User or outlet not found.");
      return res.status(404).json({ error: "User outlet not found" });
    }

    console.log("🏬 Fetching appointments for Outlet ID:", user.outlet._id);

    const appointments = await Appointment.find({ outlet: user.outlet._id })
      .populate("services.service")
      .populate("services.assignedTo")
      .populate("packages.package")
      .populate("packages.assignedTo")
      .populate("outlet", "name");

    console.log("✅ Appointments fetched:", appointments.length);
    res.json({ appointments });
  } catch (error) {
    console.error("💥 Error fetching appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
