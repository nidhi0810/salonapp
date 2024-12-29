const mongoose = require('mongoose');
const Outlet = require('./models/OutletMaster'); // Adjust the path to your model

const mongoURI = "mongodb+srv://nidhiputhrannp:nid081005@cluster0.yuoi5.mongodb.net/salon?retryWrites=true&w=majority"; // Replace with your actual MongoDB URI

// Define the seed data
const seedOutlets = async () => {
    const outlets = [
        {
            _id:'675fd255af4a5b4d1919d777',
            imageUrl: 'https://bayleaf.onrender.com/uploads/carousel1.png',
            googleMapLink: 'https://maps.app.goo.gl/6GmKHvUWV9jKSkXm7', // Replace with actual Google Map link
            telephoneNumber: '1234567890', // Placeholder phone number
            pincode: '400001', // Placeholder pincode
            state: 'Maharashtra', // Placeholder state
            city: 'Mumbai', // Placeholder city
            address1: '123 Bayleaf Street', // Placeholder address
            outletName: 'Bayleaf Salon', // Example outlet name
        },
        {
            _id:'675fd255af4a5b4d1919d778',
            imageUrl: 'https://bayleaf.onrender.com/uploads/carousel2.png',
            googleMapLink: 'https://maps.app.goo.gl/BM48E5x1rhE9jRj67', // Replace with actual Google Map link
            telephoneNumber: '0987654321', // Placeholder phone number
            pincode: '400002', // Placeholder pincode
            state: 'Maharashtra', // Placeholder state
            city: 'Mumbai', // Placeholder city
            address1: '456 Bayleaf Avenue', // Placeholder address
            outletName: 'Bayleaf Salon 2', // Example outlet name
        },
    ];

    try {
        for (const outlet of outlets) {
            await Outlet.findByIdAndUpdate(
                outlet._id,
                {
                    outletName: outlet.outletName,
                    imageUrl: outlet.imageUrl,
                    googleMapLink: outlet.googleMapLink,
                    telephoneNumber: outlet.telephoneNumber,
                    pincode: outlet.pincode,
                    state: outlet.state,
                    city: outlet.city,
                    address1: outlet.address1,
                },
                { new: true, upsert: false } // Do not create new documents if they don't exist
            );
            console.log(`Updated outlet with ID: ${outlet._id}`);
        }
        console.log('Outlets updated successfully');
    } catch (err) {
        console.error('Error updating outlet data:', err);
    }
};
// Connect to the database and seed the data
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to the database');
        return seedOutlets();
    })
    .then(() => {
        console.log('Seeding completed. Closing the database connection.');
        mongoose.connection.close();
    })
    .catch((err) => {
        console.error('Error connecting to the database:', err);
        mongoose.connection.close();
    });