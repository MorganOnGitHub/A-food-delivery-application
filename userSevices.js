const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import services and validators
const textDisplayValidator = require('./middleware/textDisplayValidator');
const searchService = require('./services/searchService');
const accountDeletionService = require('./services/accountDeletionService');

// Get User model from existing schema
const User = mongoose.model('User');

// Search user by email with validation
router.get('/search/email/:email', 
    textDisplayValidator.validateSpecialCharacters(),
    async (req, res) => {
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

// Search users by name with validation
router.get('/search/name/:name', 
    textDisplayValidator.validateSpecialCharacters(),
    async (req, res) => {
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

// Change password with validation
router.post('/change-password',
    textDisplayValidator.validateRequiredFields(),
    textDisplayValidator.validateSpecialCharacters(),
    async (req, res) => {
        try {
            const { email, currentPassword, newPassword } = req.body;

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

// Account deletion request
router.post('/delete-request', async (req, res) => {
    try {
        const { userId, password } = req.body;
        
        await accountDeletionService.validateDeleteRequest(userId, req.user?.id);
        const deletionRequest = await accountDeletionService.requestAccountDeletion(userId, password);
        
        res.json({
            success: true,
            deletionRequestId: deletionRequest._id,
            message: 'Deletion request created successfully'
        });
    } catch (err) {
        console.error('Error in deletion request:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

// Confirm account deletion
router.post('/confirm-deletion', async (req, res) => {
    try {
        const { userId, deletionRequestId } = req.body;
        
        await accountDeletionService.confirmAccountDeletion(userId, deletionRequestId);
        
        res.json({
            success: true,
            message: 'Account successfully deleted'
        });
    } catch (err) {
        console.error('Error in account deletion:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

// Enhanced search with sorting
router.get('/search', async (req, res) => {
    try {
        const { query, sortBy = 'name', order = 'asc' } = req.query;
        
        try {
            // Validate sort criteria
            searchService.validateSortCriteria(sortBy, order);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Perform search
        const results = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        });

        // Process and sort results
        const processedResults = searchService.processSearchResults(results, sortBy, order);

        res.json({
            success: true,
            count: processedResults.length,
            results: processedResults
        });
    } catch (err) {
        console.error('Error in search:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error during search'
        });
    }
});

module.exports = router;