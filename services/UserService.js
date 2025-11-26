/**
 * User Service Layer
 * Business logic for user operations
 */

const UserRepository = require('../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Token and user data
     */
    async register(userData) {
        try {
            const { name, email, password } = userData;

            // Check if user exists
            const existingUser = await UserRepository.findByEmail(email);
            if (existingUser) {
                throw new Error('User already exists');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const user = await UserRepository.create({
                name,
                email,
                password: hashedPassword
            });

            // Generate token
            const token = this.generateToken(user._id);

            return {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            };
        } catch (error) {
            console.error('UserService.register Error:', error.message);
            throw error;
        }
    }

    /**
     * Login user
     * @param {String} email - User email
     * @param {String} password - User password
     * @returns {Promise<Object>} Token and user data
     */
    async login(email, password) {
        try {
            // Find user
            const user = await UserRepository.findByEmail(email);
            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Validate password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            // Generate token
            const token = this.generateToken(user._id);

            return {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    familyId: user.familyId
                }
            };
        } catch (error) {
            console.error('UserService.login Error:', error.message);
            throw error;
        }
    }

    /**
     * Get user profile
     * @param {String} userId - User ID
     * @returns {Promise<Object>} User data
     */
    async getProfile(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            console.error('UserService.getProfile Error:', error.message);
            throw error;
        }
    }

    /**
     * Update user profile
     * @param {String} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated user
     */
    async updateProfile(userId, updateData) {
        try {
            // Don't allow password update through this method
            delete updateData.password;
            delete updateData.email;

            const user = await UserRepository.update(userId, updateData);
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            console.error('UserService.updateProfile Error:', error.message);
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
            return await UserRepository.updatePreferences(userId, preferences);
        } catch (error) {
            console.error('UserService.updatePreferences Error:', error.message);
            throw error;
        }
    }

    /**
     * Generate JWT token
     * @param {String} userId - User ID
     * @returns {String} JWT token
     */
    generateToken(userId) {
        const payload = { user: { id: userId } };
        return jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '7d' }
        );
    }
}

module.exports = new UserService();
