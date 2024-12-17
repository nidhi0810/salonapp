const mongoose = require('mongoose');

// MongoDB Atlas URI with database name
const uri = "mongodb+srv://<username>:<password>@cluster0.yuoi5.mongodb.net/salon?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB using mongoose
const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB Atlas");
    } catch (error) {
        console.error("Error connecting to MongoDB Atlas:", error);
        process.exit(1);  // Exit the process with an error code
    }
};

module.exports = connectDB;
