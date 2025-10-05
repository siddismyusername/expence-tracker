import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import serverConfig from './config/serverConfig.js';
import router from './routes/index.js';
import { requestLogger } from './middleware/logger.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Serve static frontend
app.use(express.static(serverConfig.PUBLIC_DIR));

// API routes
app.use(router);

// Friendly routes (hide filenames)
app.get('/', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'page1.html'));
});
app.get('/expenses', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'page2.html'));
});
app.get('/report', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'page3.html'));
});
app.get('/settings', (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'settings.html'));
});

// Fallback for deep links excluding API
app.get(/^(?!\/api\/).*$/, (_req, res) => {
	res.sendFile(path.join(serverConfig.PUBLIC_DIR, 'pages', 'page1.html'));
});

// DB
mongoose.set('strictQuery', true);
mongoose.connect(serverConfig.MONGODB_URI).then(()=>{
	console.log('MongoDB connected');
}).catch(err=>{
	console.error('MongoDB connection error:', err.message);
});

app.listen(serverConfig.PORT, () => {
	console.log(`Server running on http://localhost:${serverConfig.PORT}`);
});


