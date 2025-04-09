// models/InviteToken.js
const mongoose = require("mongoose");

const inviteTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  role: { type: String, default: "staff" },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: "2d" }, // optional expiry
});

module.exports = mongoose.model("InviteToken", inviteTokenSchema);
