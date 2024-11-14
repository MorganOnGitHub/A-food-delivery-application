const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define DeletionRequest Schema
const DeletionRequestSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    requestedAt: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed'], 
        default: 'pending' 
    }
});

// Create DeletionRequest model if it doesn't exist
const DeletionRequest = mongoose.models.DeletionRequest || mongoose.model('DeletionRequest', DeletionRequestSchema);

// Get User model
const User = mongoose.model('User');

const accountDeletionService = {
    async validateDeleteRequest(userId, authenticatedUserId) {
        // Verify user is deleting their own account
        if (userId !== authenticatedUserId) {
            throw new Error('Unauthorized: Cannot delete other user accounts');
        }

        // Check for pending deletion requests
        const pendingRequest = await DeletionRequest.findOne({ userId, status: 'pending' });
        if (pendingRequest) {
            throw new Error('A deletion request is already pending for this account');
        }

        return true;
    },

    async requestAccountDeletion(userId, password) {
        const user = await User.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Require re-authentication
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Re-authentication failed: Invalid password');
        }

        // Create deletion request
        const deletionRequest = new DeletionRequest({
            userId,
            requestedAt: new Date(),
            status: 'pending'
        });

        await deletionRequest.save();
        return deletionRequest;
    },

    async confirmAccountDeletion(userId, deletionRequestId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Verify deletion request exists and is pending
            const deletionRequest = await DeletionRequest.findOne({
                _id: deletionRequestId,
                userId,
                status: 'pending'
            }).session(session);

            if (!deletionRequest) {
                throw new Error('Invalid or expired deletion request');
            }

            // Delete the user account
            const deletedUser = await User.findByIdAndDelete(userId).session(session);
            if (!deletedUser) {
                throw new Error('User not found or already deleted');
            }
            
            // Update deletion request status
            deletionRequest.status = 'completed';
            await deletionRequest.save({ session });

            await session.commitTransaction();
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
};

module.exports = accountDeletionService;