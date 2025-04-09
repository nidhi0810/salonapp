const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({}, { strict: false });
const Appointment = mongoose.model(
  "Appointment",
  appointmentSchema,
  "appointments"
);

const mongoURI =
  "mongodb+srv://nidhiputhrannp:nid081005@cluster0.yuoi5.mongodb.net/salon?retryWrites=true&w=majority";

const deleteAllAppointments = async () => {
  try {
    const result = await Appointment.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} appointments.`);
  } catch (err) {
    console.error("💥 Error deleting appointments:", err);
  }
};

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("📦 Connected to MongoDB");
    return deleteAllAppointments();
  })
  .then(() => {
    console.log("🚪 Deletion complete. Closing DB connection.");
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("💥 Connection error:", err);
    mongoose.connection.close();
  });
