/**
 * User Repository
 * Centralized database operations for User model
 * All database queries for users are handled here
 */

const User = require('../models/User');

class UserRepository {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async create(userData) {
        try {
            const user = new User(userData);
            return await user.save();
        } catch (error) {
            console.error('UserRepository.create Error:', error.message);
            throw error;
        }
    }

    /**
     * Find user by ID
     * @param {String} userId - User ID
     * @param {String} selectFields - Fields to select (default: exclude password)
     * @returns {Promise<Object>} User object
     */
    async findById(userId, selectFields = '-password') {
        try {
            return await User.findById(userId).select(selectFields);
        } catch (error) {
            console.error('UserRepository.findById Error:', error.message);
            throw error;
        }
    }

    /**
     * Find user by email
     * @param {String} email - User email
     * @returns {Promise<Object>} User object
     */
    async findByEmail(email) {
        try {
            return await User.findOne({ email });
        } catch (error) {
            console.error('UserRepository.findByEmail Error:', error.message);
            throw error;
        }
    }

    /**
     * Find users by family ID
     * @param {String} familyId - Family ID
     * @returns {Promise<Array>} Array of users
     */
    async findByFamilyId(familyId) {
        try {
            return await User.find({ familyId }).select('-password');
        } catch (error) {
            console.error('UserRepository.findByFamilyId Error:', error.message);
            throw error;
        }
    }

    /**
     * Update user by ID
     * @param {String} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated user
     */
    async update(userId, updateData) {
        try {
            return await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password');
        } catch (error) {
            console.error('UserRepository.update Error:', error.message);
            throw error;
        }
    }

    /**
     * Update user preferences
     * @param {String} userId - User ID
     * @param {Object} preferences - Preferences to update
     * @returns {Promise<Object>} Updated user
     */
    async updatePreferences(userId, preferences) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            user.preferences = { ...user.preferences, ...preferences };
            await user.save();
            
            return user;
        } catch (error) {
            console.error('UserRepository.updatePreferences Error:', error.message);
            throw error;
        }
    }

    /**
     * Delete user by ID
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Deleted user
     */
    async delete(userId) {
        try {
            return await User.findByIdAndDelete(userId);
        } catch (error) {
            console.error('UserRepository.delete Error:', error.message);
            throw error;
        }
    }

    /**
     * Get total user count
     * @returns {Promise<Number>} Total users
     */
    async count() {
        try {
            return await User.countDocuments();
        } catch (error) {
            console.error('UserRepository.count Error:', error.message);
            throw error;
        }
    }

    /**
     * Check if email exists
     * @param {String} email - Email to check
     * @returns {Promise<Boolean>} True if exists
     */
    async emailExists(email) {
        try {
            const user = await User.findOne({ email });
            return !!user;
        } catch (error) {
            console.error('UserRepository.emailExists Error:', error.message);
            throw error;
        }
    }
}

module.exports = new UserRepository();
