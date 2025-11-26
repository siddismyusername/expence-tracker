/**
 * Family Service Layer
 * Business logic for family operations
 */

const FamilyRepository = require('../repositories/FamilyRepository');
const UserRepository = require('../repositories/UserRepository');

class FamilyService {
    /**
     * Create a new family
     * @param {String} userId - User ID
     * @param {String} name - Family name
     * @returns {Promise<Object>} Created family with family ID
     */
    async createFamily(userId, name) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user already has a family
            if (user.familyId) {
                throw new Error('User already belongs to a family');
            }

            // Generate unique family ID
            const familyId = 'fam_' + Math.random().toString(36).substr(2, 9);

            // Create family
            const family = await FamilyRepository.create({
                name,
                familyId,
                createdBy: userId,
                members: [userId]
            });

            // Update user's familyId
            await UserRepository.update(userId, { familyId: family._id });

            return {
                family: await FamilyRepository.findById(family._id, true),
                familyId
            };
        } catch (error) {
            console.error('FamilyService.createFamily Error:', error.message);
            throw error;
        }
    }

    /**
     * Join a family
     * @param {String} userId - User ID
     * @param {String} familyId - Family ID string to join
     * @returns {Promise<Object>} Updated family
     */
    async joinFamily(userId, familyId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user already has a family
            if (user.familyId) {
                throw new Error('User already belongs to a family');
            }

            // Find family by familyId string
            const family = await FamilyRepository.findByFamilyId(familyId);
            if (!family) {
                throw new Error('Family not found');
            }

            // Add user to family
            await FamilyRepository.addMember(family._id, userId);

            // Update user's familyId
            await UserRepository.update(userId, { familyId: family._id });

            return await FamilyRepository.findById(family._id, true);
        } catch (error) {
            console.error('FamilyService.joinFamily Error:', error.message);
            throw error;
        }
    }

    /**
     * Leave a family
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Result message
     */
    async leaveFamily(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.familyId) {
                throw new Error('User is not part of any family');
            }

            const family = await FamilyRepository.findById(user.familyId);
            if (!family) {
                throw new Error('Family not found');
            }

            // Remove user from family
            await FamilyRepository.removeMember(user.familyId, userId);

            // Update user's familyId
            await UserRepository.update(userId, { familyId: null });

            // If no members left, delete the family
            const updatedFamily = await FamilyRepository.findById(family._id);
            if (updatedFamily && updatedFamily.members.length === 0) {
                await FamilyRepository.delete(family._id);
            }

            return { msg: 'Left family successfully' };
        } catch (error) {
            console.error('FamilyService.leaveFamily Error:', error.message);
            throw error;
        }
    }

    /**
     * Get family details
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Family details with members
     */
    async getFamilyDetails(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.familyId) {
                return null;
            }

            const family = await FamilyRepository.findById(user.familyId, true);
            return family;
        } catch (error) {
            console.error('FamilyService.getFamilyDetails Error:', error.message);
            throw error;
        }
    }

    /**
     * Get family members
     * @param {String} userId - User ID
     * @returns {Promise<Array>} Array of family members
     */
    async getFamilyMembers(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.familyId) {
                return [];
            }

            return await UserRepository.findByFamilyId(user.familyId);
        } catch (error) {
            console.error('FamilyService.getFamilyMembers Error:', error.message);
            throw error;
        }
    }

    /**
     * Update family details
     * @param {String} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated family
     */
    async updateFamily(userId, updateData) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user || !user.familyId) {
                throw new Error('User is not part of any family');
            }

            const family = await FamilyRepository.findById(user.familyId);
            
            // Only creator can update family
            if (family.createdBy.toString() !== userId) {
                throw new Error('Only family creator can update family details');
            }

            return await FamilyRepository.update(user.familyId, updateData);
        } catch (error) {
            console.error('FamilyService.updateFamily Error:', error.message);
            throw error;
        }
    }
}

module.exports = new FamilyService();
