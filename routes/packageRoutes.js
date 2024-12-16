// routes/packageRoutes.js
const express = require('express');
const router = express.Router();
const Package = require('../models/PackageMaster');  // Import the Package model

// Get all packages
router.get('/', async (req, res) => {
    try {
        const packages = await Package.find(); // Fetch all packages from the database
        res.json({ data: packages });
    } catch (err) {
        console.error('Error fetching packages:', err.message);
        res.status(500).json({ message: 'Error fetching packages', error: err.message });
    }
});

// Get a specific package or multiple packages by ID
router.get('/:ids', async (req, res) => {
    try {
        const ids = req.params.ids.split(','); // Split IDs if multiple are passed
        const packages = await Package.find({ _id: { $in: ids } }); // Fetch matching packages

        if (!packages || packages.length === 0) {
            return res.status(404).json({ message: 'Package(s) not found' });
        }

        res.json({ data: packages });
    } catch (error) {
        console.error('Error fetching package(s):', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a specific package by ID
router.get('/:id', async (req, res) => {
    try {
        const package = await Package.findById(req.params.id).populate('services');
        if (!package) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.json({ data: package });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching package', error: err });
    }
});

// Add a new package
router.post('/', async (req, res) => {
    const { packageName, price, services } = req.body;

    try {
        const newPackage = new Package({ packageName, price, services });
        await newPackage.save();
        res.status(201).json({ message: 'Package created successfully', data: newPackage });
    } catch (err) {
        res.status(500).json({ message: 'Error creating package', error: err });
    }
});

// Update a package
router.put('/:id', async (req, res) => {
    const { packageName, price, services } = req.body;

    try {
        const updatedPackage = await Package.findByIdAndUpdate(
            req.params.id,
            { packageName, price, services },
            { new: true }
        ).populate('services');

        if (!updatedPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.json({ message: 'Package updated successfully', data: updatedPackage });
    } catch (err) {
        res.status(500).json({ message: 'Error updating package', error: err });
    }
});

// Delete a package
router.delete('/:id', async (req, res) => {
    try {
        const deletedPackage = await Package.findByIdAndDelete(req.params.id);
        if (!deletedPackage) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.json({ message: 'Package deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting package', error: err });
    }
});

module.exports = router;