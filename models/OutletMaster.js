const mongoose = require("mongoose");

const OutletMasterSchema = new mongoose.Schema({
    outletName: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 50,
        match: /^[a-zA-Z0-9\s]+$/, // Alphanumeric with spaces allowed
    },
    address1: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 200,
    },
    address2: {
        type: String,
        minlength: 0,
        maxlength: 200,
    },
    address3: {
        type: String,
        minlength: 0,
        maxlength: 200,
    },
    landmark: {
        type: String,
        minlength: 0,
        maxlength: 200,
    },
    city: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 200,
        match: /^[a-zA-Z0-9\s]+$/, // Alphanumeric with spaces allowed
    },
    state: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 200,
        match: /^[a-zA-Z0-9\s]+$/, // Alphanumeric with spaces allowed
    },
    pincode: {
        type: String,
        required: true,
        match: /^\d{6}$/, // Exactly 6 digits
    },
    googleMapLink: {
        type: String,
    },
    telephoneNumber: {
        type: String,
        required: true,
        match: /^\d{10,12}$/, // 10 to 12 digits
    },
    email: {
        type: String,
        match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, // Email validation
    },
});

module.exports = mongoose.model("OutletMaster", OutletMasterSchema);
