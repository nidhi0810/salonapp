const mongoose = require("mongoose");

const ServiceMasterSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
        minlength: 4,
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
        enum: ["Hair", "Beauty", "Nail", "Others"], // Restricted options
    },
    imageUrl: {
        type: String, // URL of the image
        required: true, // Optional: If you want to ensure each service has an image
    },
});

module.exports = mongoose.model("ServiceMaster", ServiceMasterSchema);
