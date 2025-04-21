const express = require("express");
const User = require("../models/user");
const Outlet = require("../models/OutletMaster"); // assuming it exists
const router = express.Router();
const Appointment = require("../models/Appointment");
const ServiceMaster = require("../models/ServiceMaster");
const PackageMaster = require("../models/PackageMaster");
router.get("/job-rankings", async (req, res) => {
  const month = req.query.month; // Month in the format YYYY-MM
  const startOfMonth = new Date(`${month}-01`);
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(startOfMonth.getMonth() + 1);

  console.log(`Start of Month: ${startOfMonth}`);
  console.log(`End of Month: ${endOfMonth}`);

  try {
    const completedJobs = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startOfMonth, $lt: endOfMonth },
          $or: [
            { "services.status": "Completed" },
            { "packages.status": "Completed" },
          ],
        },
      },
      {
        $facet: {
          services: [
            { $unwind: "$services" },
            { $match: { "services.status": "Completed" } },
            {
              $group: {
                _id: "$services.assignedTo", // Group by staff assigned to the service
                completedJobs: { $sum: 1 }, // Count completed services for each staff member
              },
            },
          ],
          packages: [
            { $unwind: "$packages" },
            { $match: { "packages.status": "Completed" } },
            {
              $group: {
                _id: "$packages.assignedTo", // Group by staff assigned to the package
                completedJobs: { $sum: 1 }, // Count completed packages for each staff member
              },
            },
          ],
        },
      },
      {
        $project: {
          completedJobs: { $concatArrays: ["$services", "$packages"] }, // Combine both services and packages
        },
      },
      { $unwind: "$completedJobs" },
      {
        $group: {
          _id: "$completedJobs._id", // Group by staff member (assignedTo)
          completedJobs: { $sum: "$completedJobs.completedJobs" }, // Sum the completed jobs for both services and packages
        },
      },
      {
        $lookup: {
          from: "users", // Assuming the staff user collection is named 'users'
          localField: "_id",
          foreignField: "_id",
          as: "staffDetails",
        },
      },
      { $unwind: "$staffDetails" }, // Unwind to get individual staff data
      {
        $project: {
          staffId: "$_id",
          completedJobs: 1,
          staffName: { $concat: ["$staffDetails.name"] }, // Using the 'name' field
        },
      },
      { $sort: { completedJobs: -1 } }, // Sort by completed jobs in descending order
    ]);

    console.log("Completed Jobs:", completedJobs); // Log the output to debug

    res.json({ success: true, staffRankings: completedJobs });
  } catch (err) {
    console.error("Error fetching job rankings:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/cart", async (req, res) => {
  try {
    console.log("🔍 GET /api/staff/cart hit");
    console.log("Session object:", req.session);

    if (!req.session.cart) {
      console.log("ℹ️ Cart not found in session, initializing...");
      req.session.cart = {
        services: [],
        packages: [],
      };
    }

    const cart = req.session.cart;

    const isCartEmpty =
      (!cart.services || cart.services.length === 0) &&
      (!cart.packages || cart.packages.length === 0);

    if (isCartEmpty) {
      console.log("🛒 Cart is empty");
      return res.status(404).json({ message: "Cart is empty" });
    }

    console.log("🧩 Populating cart...");

    const servicesDetailed = await Promise.all(
      cart.services.map(async (serviceId) => {
        const service = await ServiceMaster.findById(serviceId);
        return { service };
      })
    );

    const packagesDetailed = await Promise.all(
      cart.packages.map(async (packageId) => {
        const pkg = await PackageMaster.findById(packageId);
        return { package: pkg };
      })
    );

    console.log("✅ Cart populated");
    res.status(200).json({
      services: servicesDetailed,
      packages: packagesDetailed,
    });
  } catch (error) {
    console.error("🔥 Error in /api/staff/cart:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/book-appointment", async (req, res) => {
  try {
    const {
      customerName,
      customerMobile,
      appointmentDate,
      appointmentTime,
      sourceOfAppointment,
      remarks,
      outlet,
      price,
      services = [],
      packages = [],
    } = req.body;

    if (
      !customerName ||
      !customerMobile ||
      !appointmentDate ||
      !appointmentTime ||
      !outlet ||
      !price
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log("Incoming services:", services);
    console.log("Incoming packages:", packages);

    const formattedServices = services
      .filter((item) => item?.service || typeof item?.service === "string")
      .map((item) => ({
        service:
          typeof item.service === "string" ? item.service : item.service._id,
        status: "Not Assigned",
      }));

    const formattedPackages = packages
      .filter((item) => item?.package || typeof item?.package === "string")
      .map((item) => ({
        package:
          typeof item.package === "string" ? item.package : item.package._id,
        status: "Not Assigned",
        services: (item.services || []).map((s) => ({
          service: typeof s === "string" ? s : s._id,
          status: "Not Assigned",
        })),
      }));

    const appointment = new Appointment({
      customerName,
      customerMobile,
      appointmentDate,
      appointmentTime,
      sourceOfAppointment,
      outlet,
      price,
      remarks,
      services: formattedServices,
      packages: formattedPackages,
      status: "Request Sent",
    });

    await appointment.save();

    req.session.cart = {
      services: [],
      packages: [],
    };

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("outlet", "outletName") // populate outlet name if applicable
      .select("name role outlet");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      name: user.name,
      outlet: user.outlet?.outletName || "N/A",
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/assign-service", async (req, res) => {
  const { appointmentId, itemId, itemType } = req.body;
  const userId = req.session.user?.userId;

  if (!userId) return res.status(401).send("Unauthorized");

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).send("Appointment not found");

    let updated = false;

    if (itemType === "package") {
      // Handle package assignment
      for (const pkg of appointment.packages) {
        if (pkg._id.toString() === itemId) {
          pkg.status = "Assigned";
          pkg.assignedTo = userId;
          updated = true;
          break;
        }
      }
    } else if (itemType === "direct") {
      // Handle direct service assignment
      for (const s of appointment.services) {
        if (s._id.toString() === itemId) {
          s.status = "Assigned";
          s.assignedTo = userId;
          updated = true;
          break;
        }
      }
    } else {
      return res.status(400).send("Invalid item type");
    }

    if (!updated) return res.status(404).send("Service or Package not found");

    await appointment.save();
    res.json({ message: "Service or Package assigned successfully" });
  } catch (err) {
    console.error("❌ Error in /assign-service:", err);
    res.status(500).send("Server error while assigning service or package");
  }
});

router.patch("/unassign-service", async (req, res) => {
  const { appointmentId, itemId, itemType, staffId } = req.body;
  const currentUserId = req.session.user?.userId;

  if (!currentUserId) return res.status(401).send("Unauthorized");

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).send("Appointment not found");

    let updated = false;

    if (itemType === "package") {
      // Handle package unassignment
      for (const pkg of appointment.packages) {
        if (
          pkg._id.toString() === itemId &&
          pkg.assignedTo?.toString() === staffId
        ) {
          pkg.status = "Not Assigned";
          pkg.assignedTo = null;
          updated = true;
          break;
        }
      }
    } else if (itemType === "direct") {
      // Handle direct service unassignment
      for (const s of appointment.services) {
        if (
          s._id.toString() === itemId &&
          s.assignedTo?.toString() === staffId
        ) {
          s.status = "Not Assigned";
          s.assignedTo = null;
          updated = true;
          break;
        }
      }
    } else {
      return res.status(400).send("Invalid item type");
    }

    if (!updated) {
      return res
        .status(404)
        .send("Service/Package not found or not assigned to this user");
    }

    await appointment.save();
    res.json({ message: "Service or Package unassigned successfully" });
  } catch (err) {
    console.error("❌ Error in /unassign-service:", err);
    res.status(500).send("Server error while unassigning service or package");
  }
});

router.get("/my-jobs/:userId", async (req, res) => {
  const userId = req.params.userId;
  console.log("🔍 Requested my-jobs for user:", userId);

  if (!userId) {
    console.warn("⚠️ No userId provided in query");
    return res.status(400).send("Missing userId");
  }

  try {
    const appointments = await Appointment.find({
      $or: [
        { "services.assignedTo": userId },
        { "packages.assignedTo": userId },
      ],
    })
      .populate("services.service")
      .populate("packages.package");

    console.log(`📦 Found ${appointments.length} matching appointments`);

    const filtered = [];

    appointments.forEach((appt, i) => {
      appt.services.forEach((s, j) => {
        if (s.assignedTo?.toString() === userId) {
          filtered.push({
            type: "service",
            appointmentId: appt._id,
            itemId: s._id,
            name: s.service?.serviceName || "[Service]",
            date: appt.appointmentDate,
            time: appt.appointmentTime,
            customer: appt.customerName,
            status: s.status,
            remarks: appt.remarks,
          });
        }
      });

      appt.packages.forEach((p, k) => {
        if (p.assignedTo?.toString() === userId) {
          filtered.push({
            type: "package",
            appointmentId: appt._id,
            itemId: p._id,
            name: p.package?.packageName || "[Package]",
            date: appt.appointmentDate,
            time: appt.appointmentTime,
            customer: appt.customerName,
            status: p.status,
            remarks: appt.remarks,
          });
        }
      });
    });

    console.log(`✅ Sending ${filtered.length} jobs for user ${userId}`);
    res.json({ jobs: filtered });
  } catch (err) {
    console.error("❌ Error fetching my-jobs:", err);
    res.status(500).send("Failed to load jobs");
  }
});

router.patch("/update-status", async (req, res) => {
  const { appointmentId, itemId, itemType, newStatus } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).send("Appointment not found");

    let updated = false;

    if (itemType === "service") {
      for (const s of appointment.services) {
        if (s._id.toString() === itemId) {
          s.status = newStatus;
          updated = true;
          break;
        }
      }
    } else {
      for (const p of appointment.packages) {
        if (p._id.toString() === itemId) {
          p.status = newStatus;
          updated = true;
          break;
        }
      }
    }

    if (!updated) return res.status(404).send("Item not found");
    await appointment.save();
    res.send("Status updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.get("/cart/:appointmentId", async (req, res) => {
  const appointmentId = req.params.appointmentId;

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate("services.service")
      .populate("packages.package");

    if (!appointment) return res.status(404).send("Appointment not found");

    const services = appointment.services || [];
    const packages = appointment.packages || [];

    // Send date and time too
    res.json({
      services,
      packages,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
    });
  } catch (err) {
    console.error("❌ Error loading cart:", err);
    res.status(500).send("Error fetching cart");
  }
});

router.post("/cart/remove", async (req, res) => {
  const { appointmentId, itemId, type } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).send("Appointment not found");

    if (type === "service") {
      appointment.services = appointment.services.filter(
        (s) => s.service?.toString() !== itemId
      );
    } else if (type === "package") {
      appointment.packages = appointment.packages.filter(
        (p) => p.package?.toString() !== itemId
      );
    }

    await appointment.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Remove from cart failed:", err);
    res.status(500).send("Error removing item");
  }
});
router.patch("/update-appointment", async (req, res) => {
  const { appointmentId, appointmentDate, appointmentTime, cart, userId } =
    req.body;

  if (!appointmentId || !userId || !cart) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update date/time
    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;

    // Filter services assigned to user and present in new cart
    appointment.services = appointment.services.filter((s) => {
      if (s.assignedTo?.toString() === userId) {
        return cart.services.includes(s.service.toString());
      }
      return true; // Keep others
    });

    // Same for packages
    appointment.packages = appointment.packages.filter((p) => {
      if (p.assignedTo?.toString() === userId) {
        return cart.packages.includes(p.package.toString());
      }
      return true;
    });

    await appointment.save();

    res.json({ message: "Appointment updated successfully" });
  } catch (err) {
    console.error("❌ Failed to update appointment:", err);
    res
      .status(500)
      .json({ message: "Server error while updating appointment" });
  }
});

router.put("/appointment/update-time", async (req, res) => {
  const { appointmentId, date, time } = req.body;

  if (!appointmentId || !date || !time) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    appointment.appointmentDate = new Date(date);
    appointment.appointmentTime = time;
    await appointment.save();

    res.json({ message: "Appointment updated successfully", appointment });
  } catch (err) {
    console.error("Error updating appointment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/staff/cart/add
router.post("/cart/add", async (req, res) => {
  const { appointmentId, itemId, type } = req.body;

  try {
    if (!appointmentId || !itemId || !type) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (type === "service") {
      // Add service only if not already present
      const exists = appointment.services.some(
        (s) => s.service.toString() === itemId
      );
      if (!exists) {
        appointment.services.push({ service: itemId });
      }
    } else if (type === "package") {
      const exists = appointment.packages.some(
        (p) => p.package.toString() === itemId
      );
      if (!exists) {
        appointment.packages.push({ package: itemId });
      }
    } else {
      return res.status(400).json({ message: "Invalid item type." });
    }

    await appointment.save();

    res.json({ message: "Item added to cart", appointment });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/dashboard/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const staff = await User.findById(userId).populate("outlet");
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.json({
      name: staff.name,
      outlet: staff.outlet?.outletName || "No Outlet",
    });
  } catch (err) {
    console.error("❌ Error fetching staff info:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/cart/addnew", async (req, res) => {
  try {
    const { itemId, type } = req.body;

    if (!itemId || !type) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Initialize cart in session if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = {
        services: [],
        packages: [],
      };
    }

    const cart = req.session.cart;

    if (type === "service") {
      const alreadyExists = cart.services.includes(itemId);
      if (!alreadyExists) {
        cart.services.push(itemId);
      }
    } else if (type === "package") {
      const alreadyExists = cart.packages.includes(itemId);
      if (!alreadyExists) {
        cart.packages.push(itemId);
      }
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }
    console.log(cart);
    res.status(200).json({ message: "Item added to session cart", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

router.post("/cart/removenew", async (req, res) => {
  try {
    const { itemId, type } = req.body;
    console.log(itemId, type);
    if (!itemId || !type) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    if (!req.session.cart) {
      return res.status(404).json({ message: "Cart not found in session" });
    }

    const cart = req.session.cart;

    if (type === "service") {
      cart.services = cart.services.filter((id) => id !== itemId);
    } else if (type === "package") {
      cart.packages = cart.packages.filter((id) => id !== itemId);
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }
    console.log(cart);

    res.status(200).json({ message: "Item removed from session cart", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing from cart" });
  }
});

module.exports = router;
