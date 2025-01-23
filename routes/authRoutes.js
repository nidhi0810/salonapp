const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const router = express.Router();

// Get Profile
router.get("/profile", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Update Profile
router.put("/profile", async (req, res) => {
  const { userId, name, email, mobile } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update the user's details
    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.updated_at = new Date();

    await user.save();

    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/google", async (req, res) => {
  const { name, email, googleId } = req.body;

  if (!name || !email || !googleId) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    // Check if a user with the same email already exists
    let user = await User.findOne({ email });

    if (!user) {
      // If the user does not exist, create a new user
      user = new User({ name, email, googleId });
      await user.save();
    }
    // Store user details in session
    req.session.user = {
      userId: user._id,
      name: user.name, // Assuming the user's name is stored in the "name" field
      role: user.role,
    };
    res.status(200).json({
      message: "User authenticated successfully",
      redirectUrl: "/",
    });
  } catch (error) {
    console.error("Error authenticating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST route to handle the signup form data
router.post("/signup", async (req, res) => {
  const { name, mobile, email, password } = req.body;

  if (!name || !mobile || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ mobile }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Mobile or Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, mobile, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving user", error: err });
  }
});

// POST route to handle login form data
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login route hit");
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Store user details in session
    console.log("Before setting session:", req.session);
    req.session.user = {
      userId: user._id,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
    };
    console.log("After setting session:", req.session);

    res.status(200).json({
      message: "User authenticated successfully",
      redirectUrl: "/",
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err });
  }
});

module.exports = router;
