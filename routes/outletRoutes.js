// routes/outletRoutes.js
const express = require('express');
const router = express.Router();
const Outlet = require('../models/OutletMaster');  // Import the Outlet model

// Get all outlets
router.get('/', async (req, res) => {
    try {
        const outlets = await Outlet.find();
        res.json({ data: outlets });
    } catch (err) {
        console.error('Error fetching outlets:', err.message);
        res.status(500).json({ message: 'Error fetching outlets', error: err });
    }
});

// Get a specific outlet by ID
router.get('/:id', async (req, res) => {
    try {
        const outlet = await Outlet.findById(req.params.id);
        if (!outlet) {
            return res.status(404).json({ message: 'Outlet not found' });
        }
        res.json({ data: outlet });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching outlet', error: err });
    }
});

// Add a new outlet
router.post('/', async (req, res) => {
    const { outletName, location } = req.body;

    try {
        const newOutlet = new Outlet({ outletName, location });
        await newOutlet.save();
        res.status(201).json({ message: 'Outlet created successfully', data: newOutlet });
    } catch (err) {
        res.status(500).json({ message: 'Error creating outlet', error: err });
    }
});

// Update an outlet
router.put('/:id', async (req, res) => {
    const { outletName, location } = req.body;

    try {
        const updatedOutlet = await Outlet.findByIdAndUpdate(
            req.params.id,
            { outletName, location },
            { new: true }
        );

        if (!updatedOutlet) {
            return res.status(404).json({ message: 'Outlet not found' });
        }
        res.json({ message: 'Outlet updated successfully', data: updatedOutlet });
    } catch (err) {
        res.status(500).json({ message: 'Error updating outlet', error: err });
    }
});

// Delete an outlet
router.delete('/:id', async (req, res) => {
    try {
        const deletedOutlet = await Outlet.findByIdAndDelete(req.params.id);
        if (!deletedOutlet) {
            return res.status(404).json({ message: 'Outlet not found' });
        }
        res.json({ message: 'Outlet deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting outlet', error: err });
    }
});

module.exports = router;
