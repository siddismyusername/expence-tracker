const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Resolve project root
const projectRoot = path.resolve(__dirname, '../..');
const publicDir = path.join(projectRoot, 'public');

const serverConfig = {
	PORT: process.env.PORT || 3000,
	MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_tracker',
	PUBLIC_DIR: publicDir,
	
	// Database connection options
	DB_OPTIONS: {
		maxPoolSize: 10,
		minPoolSize: 2,
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
		family: 4
	},
	
	// JWT Configuration
	JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
	JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
	
	// Session Configuration
	SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
	SESSION_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
	
	// SMTP Configuration
	SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
	SMTP_PORT: process.env.SMTP_PORT || 587,
	SMTP_USER: process.env.SMTP_USER,
	SMTP_PASS: process.env.SMTP_PASS,
	SMTP_FROM: process.env.SMTP_FROM,
	
	// App URL
	APP_URL: process.env.APP_URL || 'http://localhost:3000'
};

module.exports = serverConfig;



