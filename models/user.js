// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, unique: true },
  email: { type: String, unique: true  },
  googleId: { type: String, unique: true},
  password: { type: String},
  role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('user', UserSchema);
