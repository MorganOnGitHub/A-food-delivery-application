const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Get User model from existing schema
const User = mongoose.model('User');

// Search user by email
router.get('/search/email/:email', async (req, res) => {
    try {
        const email = req.params.email;
        
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const user = await User.findOne({ email: email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                phone_number: user.phone_number
            }
        });
    } catch (err) {
        console.error('Error searching user by email:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Search users by name
router.get('/search/name/:name', async (req, res) => {
    try {
        const name = req.params.name;
        
        if (!name || name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long'
            });
        }

        const users = await User.find({
            name: { $regex: name, $options: 'i' }
        });
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No users found'
            });
        }

        res.json({
            success: true,
            users: users.map(user => ({
                name: user.name,
                email: user.email,
                phone_number: user.phone_number
            }))
        });
    } catch (err) {
        console.error('Error searching users by name:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        // Input validation
        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Password strength validation
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long'
            });
        }

        // Find user
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        if (user.password !== currentPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword; // In production, hash this password
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;