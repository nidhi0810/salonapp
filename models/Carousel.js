// Carousel Schema and Model
const mongoose = require('mongoose');

const CarouselSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true }, // Path to image
  });
  
  module.exports = mongoose.model('Carousel', CarouselSchema);
  