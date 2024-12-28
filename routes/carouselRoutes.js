// Carousel Data Route
const express = require('express');
const router = express.Router();
const Carousel = require('../models/Carousel'); 
router.get('/', async (req, res) => {
  try {
    const carouselItems = await Carousel.find();
    res.json(carouselItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch carousel data' });
  }
});

module.exports = router;
