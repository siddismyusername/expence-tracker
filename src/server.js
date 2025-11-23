const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
// Session removed: Incompatible with serverless/Vercel (stateless) and redundant (using JWT)
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

// Logging and performance monitoring
app.use(performanceMonitor);
app.use(requestLogger);

// Optional authentication for all requests
app.use(optionalAuth);

// Serve static frontend (Fallback for local dev, Vercel handles this via CDN usually)
app.use(express.static(serverConfig.PUBLIC_DIR));

// Database Connection Pattern for Serverless
let isConnected = false;
const connectDB = async () => {
	if (isConnected) return;
	try {
		mongoose.set('strictQuery', true);
		await mongoose.connect(serverConfig.MONGODB_URI, serverConfig.DB_OPTIONS);
		isConnected = true;
		console.log('MongoDB connected successfully');
	} catch (err) {
		console.error('MongoDB connection error:', err.message);
	}
};

// Connect to DB on every request (cached)
app.use(async (req, res, next) => {
	await connectDB();
	next();
});

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

// Start server
if (require.main === module) {
	// Only connect immediately in standalone mode
	connectDB().then(() => {
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
	});
}

module.exports = app;
	});
}

module.exports = app;



