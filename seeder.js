const mongoose = require('mongoose');
const Carousel = require('./models/Carousel'); // Adjust the path to your model

const uri = "mongodb+srv://nidhiputhrannp:nid081005@cluster0.yuoi5.mongodb.net/salon?retryWrites=true&w=majority"; // Replace with your actual MongoDB URI

const seedCarouselData = async () => {
  const carouselItems = [
    {
      title: 'Welcome to Bayleaf',
      imageUrl: 'https://bayleaf.onrender.com/uploads/carousel1.png',
    },
    {
      title: 'Exclusive Hair Care',
      imageUrl: 'https://bayleaf.onrender.com/uploads/carousel2.png',
    },
    {
      title: 'Beauty Treatments',
      imageUrl: 'https://bayleaf.onrender.com/uploads/carousel3.png',
    },
  ];

  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    // Clear existing data in the Carousel collection
    console.log("Clearing existing carousel data...");
    await Carousel.deleteMany();

    // Insert new carousel data
    console.log("Inserting new carousel data...");
    await Carousel.insertMany(carouselItems);
    console.log("Carousel data seeded successfully.");
  } catch (err) {
    console.error("Error seeding carousel data:", err);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

// Run the seed function
seedCarouselData();
