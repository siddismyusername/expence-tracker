/**
 * Database Connection Manager
 * Centralized MongoDB connection configuration and management
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

class DatabaseManager {
    constructor() {
        this.connection = null;
        this.config = {
            uri: process.env.MONGO_URI || 'mongodb://localhost:27017/family-expense-tracker',
            options: {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            }
        };
    }

    /**
     * Establish database connection
     * @returns {Promise<void>}
     */
    async connect() {
        try {
            if (this.connection) {
                console.log('Database already connected');
                return this.connection;
            }

            await mongoose.connect(this.config.uri, this.config.options);
            this.connection = mongoose.connection;

            this.connection.on('connected', () => {
                console.log('✓ MongoDB Connected Successfully');
            });

            this.connection.on('error', (err) => {
                console.error('✗ MongoDB Connection Error:', err);
            });

            this.connection.on('disconnected', () => {
                console.log('MongoDB Disconnected');
            });

            return this.connection;
        } catch (error) {
            console.error('Failed to connect to database:', error);
            throw error;
        }
    }

    /**
     * Disconnect from database
     * @returns {Promise<void>}
     */
    async disconnect() {
        try {
            await mongoose.disconnect();
            this.connection = null;
            console.log('Database disconnected');
        } catch (error) {
            console.error('Error disconnecting from database:', error);
            throw error;
        }
    }

    /**
     * Get current connection status
     * @returns {boolean}
     */
    isConnected() {
        return mongoose.connection.readyState === 1;
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        if (!this.isConnected()) {
            throw new Error('Database not connected');
        }

        const admin = mongoose.connection.db.admin();
        const stats = await admin.serverStatus();
        
        return {
            connections: stats.connections,
            uptime: stats.uptime,
            version: stats.version,
            databases: await mongoose.connection.db.admin().listDatabases()
        };
    }
}

// Export singleton instance
module.exports = new DatabaseManager();
