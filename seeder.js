const mongoose = require('mongoose');
const path = require('path');
const ServiceMaster = require('./models/ServiceMaster'); // Path to your ServiceMaster model

// MongoDB Atlas URI
const uri = "mongodb+srv://nidhiputhrannp:nid081005@cluster0.yuoi5.mongodb.net/salon?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
    process.exit(1);  // Exit the process with an error code
  });

// Function to update services with images
const updateServicesWithImages = async () => {
  try {
    // Find all services in the collection
    const services = await ServiceMaster.find();
    console.log(`Found ${services.length} services to update`);

    // Loop through all services and update with the corresponding image URL
    for (const service of services) {
      // Assuming the image name is based on the service name
      const imageUrl = `https://bayleaf.onrender.com/uploads/${service.serviceName.replace(/\s+/g, '-').toLowerCase()}.jpg`; // Format the image URL
      
      // Update the service with the image URL
      service.imageUrl = imageUrl;
      await service.save();

      console.log(`Updated service: ${service.serviceName} with image URL: ${imageUrl}`);
    }

    console.log("All services updated with images!");
    mongoose.connection.close(); // Close the database connection after the operation
  } catch (error) {
    console.error("Error updating services:", error);
    mongoose.connection.close(); // Close the connection in case of error
  }
};

// Run the update function
updateServicesWithImages();
