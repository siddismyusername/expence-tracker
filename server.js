const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./database/connection');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from root

// Connect to Database
db.connect()
    .then(() => {
        // Routes - Only initialize after DB connection
        app.use('/api/auth', require('./routes/auth'));
        app.use('/api/family', require('./routes/family'));
        app.use('/api/expenses', require('./routes/expenses'));

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'dashboard.html')); // Default to dashboard, will redirect if not logged in
        });

        // Start Server
        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Visit: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('✗ Failed to start server:', err);
        process.exit(1);
    });
