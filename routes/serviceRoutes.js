// routes/serviceRoutes.js
const express = require("express");
const router = express.Router();
const Service = require("../models/ServiceMaster"); // Import the Service model

// Backend: Query services by exact match on serviceName
// Sample Express route to handle the search query
router.get("/", async (req, res) => {
  const searchQuery = req.query.search;
  console.log("Search query:", searchQuery); // Log the search query

  try {
    const services = await Service.find({
      serviceName: { $regex: new RegExp(searchQuery, "i") },
    });
    res.json({ data: services });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).send("Error fetching services");
  }
});

// Get services by one or multiple IDs
router.get("/:ids", async (req, res) => {
  try {
    // Split the comma-separated IDs into an array
    const ids = req.params.ids.split(",");

    // Validate the format of ObjectId
    const validIds = ids.filter((id) => /^[a-f\d]{24}$/i.test(id));
    if (validIds.length === 0) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Fetch services matching the valid IDs
    const services = await Service.find({ _id: { $in: validIds } });

    if (!services || services.length === 0) {
      return res.status(404).json({ message: "Service(s) not found" });
    }

    res.json({ data: services });
  } catch (error) {
    console.error("Error fetching service(s):", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.post("/services", async (req, res) => {
  const { serviceName, duration, price } = req.body;
  try {
    const newService = new ServiceMaster({ serviceName, duration, price });
    await newService.save();
    res.status(201).json(newService);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ message: "Error creating service", error });
  }
});

// Get services by category
router.get("/category/:category", async (req, res) => {
  const category = req.params.category;
  console.log("Category:", category); // Log category to ensure it's a string
  try {
    const services = await Service.find({ category: category });
    res.json(services);
  } catch (error) {
    console.error("Error fetching package(s):", error);
    res.status(500).send("Error fetching packages");
  }
});
module.exports = router;
