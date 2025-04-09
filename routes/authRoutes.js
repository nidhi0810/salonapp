const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const InviteToken = require("../models/InviteToken");

const router = express.Router();

// POST /admin/generate-invite
router.post("/admin/generate-invite", async (req, res) => {
  const { role = "staff" } = req.body;
  console.log("Generating token");
  const token = require("crypto").randomBytes(32).toString("hex");

  await InviteToken.create({ token, role });

  const inviteLink = `https://bayleaf.onrender.com/register/${token}`;
  res.json({ inviteLink });
});

// POST /register/:token
router.post("/register/:token", async (req, res) => {
  const { token } = req.params;
  const { name, email, password, mobile, outletId } = req.body;

  try {
    const invite = await InviteToken.findOne({ token, used: false });
    if (!invite) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Check if user with same email or mobile already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User already exists with this email or phone" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: invite.role, // likely "staff"
      outlet: outletId, // link to outlet
    });

    invite.used = true;
    await invite.save();

    res.json({ message: "Registration successful", user: newUser });
  } catch (error) {
    console.error("Error in register token route:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

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
    if (user.role === "customer") {
      res.status(200).json({
        message: "User authenticated successfully",
        redirectUrl: "/",
      });
    } else if (user.role === "staff") {
      res.status(200).json({
        message: "User authenticated successfully",
        redirectUrl: "/adminviewappointment",
      });
    } else {
      res.status(403).json({
        message: "Unauthorized role",
      });
    }
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

    if (user.role === "customer") {
      res.status(200).json({
        message: "User authenticated successfully",
        redirectUrl: "/",
      });
    } else if (user.role === "staff") {
      res.status(200).json({
        message: "User authenticated successfully",
        redirectUrl: "/adminviewappointment",
      });
    } else {
      res.status(403).json({
        message: "Unauthorized role",
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err });
  }
});

router.get("/logout", (req, res) => {
  // Destroy the session if you're using express-session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Error logging out");
    }

    // Redirect to homepage or login page
    res.redirect("/");
  });
});

module.exports = router;
