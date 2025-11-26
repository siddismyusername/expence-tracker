const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        default: null
    },
    profilePicture: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=User&background=random'
    },
    preferences: {
        currency: { type: String, default: 'USD' },
        notificationThreshold: { type: Number, default: 0 },
        notificationsEnabled: { type: Boolean, default: false }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
