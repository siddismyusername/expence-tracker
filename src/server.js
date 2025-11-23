const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const serverConfig = require('./config/serverConfig');
const { requestLogger, performanceMonitor } = require('./middleware/logger');
const { optionalAuth } = require('./middleware/auth');
const open = require('open');

const app = express();

// Middleware
app.use(cors({
	origin: process.env.CORS_ORIGIN || '*',
	credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
	secret: serverConfig.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		maxAge: serverConfig.SESSION_MAX_AGE
	}
}));

// Logging and performance monitoring
app.use(performanceMonitor);
app.use(requestLogger);

// Optional authentication for all requests
app.use(optionalAuth);

// Serve static frontend
app.use(express.static(serverConfig.PUBLIC_DIR));

// API routes
const expenseRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');

app.use('/api', expenseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);

// Friendly routes (hide filenames)
app.get('/', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'index.html'));
});
app.get('/expenses', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'expenses.html'));
});
app.get('/report', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'dashboard.html'));
});
app.get('/settings', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'settings.html'));
});
app.get('/login', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'login.html'));
});
app.get('/register', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'register.html'));
});
app.get('/family', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'family.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Error:', err);
	res.status(err.status || 500).json({
		success: false,
		error: err.message || 'Internal server error'
	});
});

// Fallback for deep links excluding API
app.get(/^(?!\/api\/).*$/, (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'index.html'));
});

// DB Connection with improved options
mongoose.set('strictQuery', true);
mongoose.connect(serverConfig.MONGODB_URI, serverConfig.DB_OPTIONS)
	.then(() => {
		console.log('MongoDB connected successfully');
		console.log(`Database: ${mongoose.connection.name}`);
		console.log(`Connection pool size: ${serverConfig.DB_OPTIONS.maxPoolSize}`);
	})
	.catch(err => {
		console.error('MongoDB connection error:', err.message);
		process.exit(1);
	});

// Graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM received, closing server...');
	await mongoose.connection.close();
	process.exit(0);
});

process.on('SIGINT', async () => {
	console.log('SIGINT received, closing server...');
	await mongoose.connection.close();
	process.exit(0);
});

// Start server
if (require.main === module) {
	app.listen(serverConfig.PORT, () => {
		console.log(`Server running on http://localhost:${serverConfig.PORT}`);
		console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
		
		// Auto-open browser only in development
		if (process.env.NODE_ENV !== 'production') {
			(async () => {
				try {
					await open(`http://localhost:${serverConfig.PORT}`);
				} catch (error) {
					console.log('Could not open browser automatically');
				}
			})();
		}
	});
}

module.exports = app;



