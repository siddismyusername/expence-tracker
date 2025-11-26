/**
 * Family Controller
 * Handles HTTP requests for family endpoints
 */

const FamilyService = require('../services/FamilyService');

class FamilyController {
    /**
     * Create a new family
     * POST /api/family/create
     */
    async createFamily(req, res) {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ msg: 'Family name is required' });
            }

            const result = await FamilyService.createFamily(req.user.id, name);
            res.json(result);
        } catch (error) {
            console.error('FamilyController.createFamily Error:', error.message);
            
            if (error.message === 'User already belongs to a family') {
                return res.status(400).json({ msg: error.message });
            }
            
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Join a family
     * POST /api/family/join
     */
    async joinFamily(req, res) {
        try {
            const { familyId } = req.body;

            if (!familyId) {
                return res.status(400).json({ msg: 'Family ID is required' });
            }

            const family = await FamilyService.joinFamily(req.user.id, familyId);
            res.json(family);
        } catch (error) {
            console.error('FamilyController.joinFamily Error:', error.message);
            
            if (error.message === 'User already belongs to a family' || 
                error.message === 'Family not found') {
                return res.status(400).json({ msg: error.message });
            }
            
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Leave family
     * POST /api/family/leave
     */
    async leaveFamily(req, res) {
        try {
            const result = await FamilyService.leaveFamily(req.user.id);
            res.json(result);
        } catch (error) {
            console.error('FamilyController.leaveFamily Error:', error.message);
            
            if (error.message === 'User is not part of any family') {
                return res.status(400).json({ msg: error.message });
            }
            
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Get family details
     * GET /api/family
     */
    async getFamily(req, res) {
        try {
            const family = await FamilyService.getFamilyDetails(req.user.id);
            res.json(family);
        } catch (error) {
            console.error('FamilyController.getFamily Error:', error.message);
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Get family members
     * GET /api/family/members
     */
    async getMembers(req, res) {
        try {
            const members = await FamilyService.getFamilyMembers(req.user.id);
            res.json(members);
        } catch (error) {
            console.error('FamilyController.getMembers Error:', error.message);
            res.status(500).json({ msg: 'Server error' });
        }
    }

    /**
     * Update family details
     * PUT /api/family
     */
    async updateFamily(req, res) {
        try {
            const family = await FamilyService.updateFamily(req.user.id, req.body);
            res.json(family);
        } catch (error) {
            console.error('FamilyController.updateFamily Error:', error.message);
            
            if (error.message === 'Only family creator can update family details') {
                return res.status(403).json({ msg: error.message });
            }
            
            res.status(500).json({ msg: 'Server error' });
        }
    }
}

module.exports = new FamilyController();
