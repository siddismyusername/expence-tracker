// Vercel serverless entry: wraps Express app
const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('../database/connection');

dotenv.config();

// Create an express app per invocation (stateless)
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // serve from project root

// Connect to DB once per cold start (best-effort)
let dbConnected = false;
async function ensureDb() {
  if (!dbConnected) {
    try {
      await db.connect();
      dbConnected = true;
    } catch (err) {
      console.error('Vercel DB connect error:', err.message);
    }
  }
}

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/family', require('../routes/family'));
app.use('/api/expenses', require('../routes/expenses'));

// Default route serves dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});

// Export Vercel-compatible handler
module.exports = async (req, res) => {
  await ensureDb();
  return app(req, res);
};
