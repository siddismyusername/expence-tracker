const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from root

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/family-expense-tracker', {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        console.error('Please check your MONGO_URI in .env file');
    });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/family', require('./routes/family'));
app.use('/api/expenses', require('./routes/expenses'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html')); // Default to dashboard, will redirect if not logged in
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
