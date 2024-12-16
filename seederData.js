const mongoose = require('mongoose');
const OutletMaster = require('./models/OutletMaster');
const ServiceMaster = require('./models/ServiceMaster');
const PackageMaster = require('./models/PackageMaster');

// MongoDB connection URL
mongoose.connect('mongodb://localhost:27017/salon', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    seedData();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });

// Seed data
const seedData = async () => {
  try {
    // Sample outlet data
    const outlets = [
      {
        outletName: "Outlet 1",
        address1: "123 Main St",
        address2: "Near Park",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400071",
        telephoneNumber: "1234567890",
        email: "outlet1@salon.com"
      },
      {
        outletName: "Outlet 2",
        address1: "456 Second St",
        address2: "Opposite Mall",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400072",
        telephoneNumber: "0987654321",
        email: "outlet2@salon.com"
      }
    ];

    // Sample service data

    const services = [
        { serviceName: "Haircut", price: 500, category: "Hair" },
        { serviceName: "Facial", price: 1500, category: "Beauty" },
        { serviceName: "Manicure", price: 800, category: "Nail" }
    ];
    

    // Sample package data
    const packages = [
        { packageName: "Basic Hair Care", price: 1000, category: "Hair", timeTaken: 30 },
        { packageName: "Nail Art", price: 700, category: "Nail", timeTaken: 45 },
        { packageName: "Beauty Treatment", price: 1500, category: "Beauty", timeTaken: 60 }
      ];
      

    // Clear existing data
    await OutletMaster.deleteMany();
    await ServiceMaster.deleteMany();
    await PackageMaster.deleteMany();

    // Insert sample data
    await OutletMaster.insertMany(outlets);
    await ServiceMaster.insertMany(services);
    await PackageMaster.insertMany(packages);

    console.log('Sample data inserted successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};
