// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const Service = require('../models/ServiceMaster');  // Import the Service model

// Get all services
router.get('/', async (req, res) => {
    try {
        const services = await Service.find();
        res.json({ data: services });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching services', error: err });
    }
});

// Get services by one or multiple IDs
router.get('/:ids', async (req, res) => {
    try {
        // Split the comma-separated IDs into an array
        const ids = req.params.ids.split(',');
        
        // Validate the format of ObjectId
        const validIds = ids.filter(id => /^[a-f\d]{24}$/i.test(id));
        if (validIds.length === 0) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Fetch services matching the valid IDs
        const services = await Service.find({ _id: { $in: validIds } });

        if (!services || services.length === 0) {
            return res.status(404).json({ message: 'Service(s) not found' });
        }

        res.json({ data: services });
    } catch (error) {
        console.error('Error fetching service(s):', error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});

router.post('/services', async (req, res) => {
    const { serviceName, duration, price } = req.body;
    try {
      const newService = new ServiceMaster({ serviceName, duration, price });
      await newService.save();
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ message: 'Error creating service', error });
    }
  });
  
module.exports = router;
