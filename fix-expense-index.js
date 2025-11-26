// Script to fix the duplicate expenseId index error and clean up unused indexes
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function fixExpenseIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/family-expense-tracker', {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('MongoDB Connected');
        
        const db = mongoose.connection.db;
        const expensesCollection = db.collection('expenses');
        
        // List all indexes first
        const indexes = await expensesCollection.indexes();
        console.log('Current indexes:', indexes.map(idx => idx.name));
        
        // Indexes to drop (unused or problematic)
        const indexesToDrop = [
            'expenseId_1',
            'approvalStatus_1',
            'isDeleted_1',
            'familyId_1_date_-1',
            'userId_1_date_-1',
            'familyId_1_category_1_date_-1',
            'date_-1',
            'category_1',
            'date_1',
            'isCommon_1'
        ];
        
        for (const indexName of indexesToDrop) {
            try {
                await expensesCollection.dropIndex(indexName);
                console.log(`✓ Dropped ${indexName}`);
            } catch (err) {
                if (err.code === 27) {
                    console.log(`- ${indexName} does not exist (skipped)`);
                } else {
                    console.error(`✗ Error dropping ${indexName}:`, err.message);
                }
            }
        }
        
        // Show remaining indexes
        const finalIndexes = await expensesCollection.indexes();
        console.log('\nFinal indexes:', finalIndexes.map(idx => idx.name));
        
        console.log('\nDatabase cleanup completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixExpenseIndex();
