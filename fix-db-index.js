// Script to fix the duplicate userId index error
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function fixIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/family-expense-tracker', {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('MongoDB Connected');
        
        // Drop the problematic userId index if it exists
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        try {
            await usersCollection.dropIndex('userId_1');
            console.log('Successfully dropped userId_1 index');
        } catch (err) {
            if (err.code === 27) {
                console.log('userId_1 index does not exist - no action needed');
            } else {
                console.error('Error dropping index:', err.message);
            }
        }
        
        console.log('Database fix completed');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixIndex();
