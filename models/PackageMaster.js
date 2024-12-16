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
});

module.exports = mongoose.model("PackageMaster", PackageMasterSchema);
