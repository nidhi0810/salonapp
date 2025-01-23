const mongoose = require("mongoose");

const PackageMasterSchema = new mongoose.Schema({
  packageName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 200,
    match: /^[a-zA-Z0-9\s]+$/, // Alphanumeric with spaces allowed
  },
  price: {
    type: Number,
    required: true,
    min: 2,
    max: 9999999999, // 10 digits maximum
  },
  timeTaken: {
    type: Number, // Optional
    max: 200,
  },
  category: {
    type: String,
    required: true,
    enum: ["Hair", "Beauty", "Nail", "Others", "Mixed"], // Restricted options
  },
  // List of default services in the package
  services: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceMaster", // Reference to the Service model
    },
  ],
});

module.exports = mongoose.model("PackageMaster", PackageMasterSchema);
