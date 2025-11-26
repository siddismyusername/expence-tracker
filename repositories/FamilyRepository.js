/**
 * Family Repository
 * Centralized database operations for Family model
 * All database queries for families are handled here
 */

const Family = require('../models/Family');

class FamilyRepository {
    /**
     * Create a new family
     * @param {Object} familyData - Family data
     * @returns {Promise<Object>} Created family
     */
    async create(familyData) {
        try {
            const family = new Family(familyData);
            return await family.save();
        } catch (error) {
            console.error('FamilyRepository.create Error:', error.message);
            throw error;
        }
    }

    /**
     * Find family by ID
     * @param {String} familyId - Family ID (MongoDB ObjectId)
     * @param {Boolean} populate - Whether to populate members
     * @returns {Promise<Object>} Family object
     */
    async findById(familyId, populate = false) {
        try {
            const query = Family.findById(familyId);
            if (populate) {
                query.populate('members', 'name email profilePicture')
                     .populate('createdBy', 'name email');
            }
            return await query;
        } catch (error) {
            console.error('FamilyRepository.findById Error:', error.message);
            throw error;
        }
    }

    /**
     * Find family by family ID string
     * @param {String} familyId - Family ID string (e.g., 'fam_abc123')
     * @param {Boolean} populate - Whether to populate members
     * @returns {Promise<Object>} Family object
     */
    async findByFamilyId(familyId, populate = false) {
        try {
            const query = Family.findOne({ familyId });
            if (populate) {
                query.populate('members', 'name email profilePicture')
                     .populate('createdBy', 'name email');
            }
            return await query;
        } catch (error) {
            console.error('FamilyRepository.findByFamilyId Error:', error.message);
            throw error;
        }
    }

    /**
     * Find families created by user
     * @param {String} userId - User ID
     * @returns {Promise<Array>} Array of families
     */
    async findByCreator(userId) {
        try {
            return await Family.find({ createdBy: userId })
                .populate('members', 'name email profilePicture');
        } catch (error) {
            console.error('FamilyRepository.findByCreator Error:', error.message);
            throw error;
        }
    }

    /**
     * Add member to family
     * @param {String} familyId - Family ID (MongoDB ObjectId)
     * @param {String} userId - User ID to add
     * @returns {Promise<Object>} Updated family
     */
    async addMember(familyId, userId) {
        try {
            return await Family.findByIdAndUpdate(
                familyId,
                { $addToSet: { members: userId } },
                { new: true }
            ).populate('members', 'name email profilePicture');
        } catch (error) {
            console.error('FamilyRepository.addMember Error:', error.message);
            throw error;
        }
    }

    /**
     * Remove member from family
     * @param {String} familyId - Family ID (MongoDB ObjectId)
     * @param {String} userId - User ID to remove
     * @returns {Promise<Object>} Updated family
     */
    async removeMember(familyId, userId) {
        try {
            return await Family.findByIdAndUpdate(
                familyId,
                { $pull: { members: userId } },
                { new: true }
            ).populate('members', 'name email profilePicture');
        } catch (error) {
            console.error('FamilyRepository.removeMember Error:', error.message);
            throw error;
        }
    }

    /**
     * Update family details
     * @param {String} familyId - Family ID (MongoDB ObjectId)
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated family
     */
    async update(familyId, updateData) {
        try {
            return await Family.findByIdAndUpdate(
                familyId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).populate('members', 'name email profilePicture');
        } catch (error) {
            console.error('FamilyRepository.update Error:', error.message);
            throw error;
        }
    }

    /**
     * Delete family
     * @param {String} familyId - Family ID (MongoDB ObjectId)
     * @returns {Promise<Object>} Deleted family
     */
    async delete(familyId) {
        try {
            return await Family.findByIdAndDelete(familyId);
        } catch (error) {
            console.error('FamilyRepository.delete Error:', error.message);
            throw error;
        }
    }

    /**
     * Get member count
     * @param {String} familyId - Family ID (MongoDB ObjectId)
     * @returns {Promise<Number>} Member count
     */
    async getMemberCount(familyId) {
        try {
            const family = await Family.findById(familyId);
            return family ? family.members.length : 0;
        } catch (error) {
            console.error('FamilyRepository.getMemberCount Error:', error.message);
            throw error;
        }
    }

    /**
     * Check if user is member of family
     * @param {String} familyId - Family ID (MongoDB ObjectId)
     * @param {String} userId - User ID
     * @returns {Promise<Boolean>} True if member
     */
    async isMember(familyId, userId) {
        try {
            const family = await Family.findById(familyId);
            return family ? family.members.includes(userId) : false;
        } catch (error) {
            console.error('FamilyRepository.isMember Error:', error.message);
            throw error;
        }
    }

    /**
     * Get total family count
     * @returns {Promise<Number>} Total families
     */
    async count() {
        try {
            return await Family.countDocuments();
        } catch (error) {
            console.error('FamilyRepository.count Error:', error.message);
            throw error;
        }
    }
}

module.exports = new FamilyRepository();
