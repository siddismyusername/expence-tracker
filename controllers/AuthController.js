/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

const UserService = require('../services/UserService');

class AuthController {
    /**
     * Register a new user
     * POST /api/auth/register
     */
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            // Validation
            if (!name || !email || !password) {
                return res.status(400).json({ msg: 'Please provide all required fields' });
            }

            const result = await UserService.register({ name, email, password });
            
            res.json(result);
        } catch (error) {
            console.error('AuthController.register Error:', error.message);
            
            if (error.message === 'User already exists') {
                return res.status(400).json({ msg: error.message });
            }
            
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({ msg: 'Please provide email and password' });
            }

            const result = await UserService.login(email, password);
            
            res.json(result);
        } catch (error) {
            console.error('AuthController.login Error:', error.message);
            
            if (error.message === 'Invalid credentials') {
                return res.status(400).json({ msg: error.message });
            }
            
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Get current user profile
     * GET /api/auth/me
     */
    async getMe(req, res) {
        try {
            const user = await UserService.getProfile(req.user.id);
            res.json(user);
        } catch (error) {
            console.error('AuthController.getMe Error:', error.message);
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Update user profile
     * PUT /api/auth/profile
     */
    async updateProfile(req, res) {
        try {
            const user = await UserService.updateProfile(req.user.id, req.body);
            res.json(user);
        } catch (error) {
            console.error('AuthController.updateProfile Error:', error.message);
            res.status(500).json({ msg: 'Server error' });
        }
    }
}

module.exports = new AuthController();
