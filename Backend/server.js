const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const codeRoutes = require('./routes/codeRoutes');
const questionRoutes = require('./routes/questionRoutes');
app.use('/api', questionRoutes);

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/code', codeRoutes);

// Root Route
app.get('/', (req, res) => {
    return res.json("Hello There! Server is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
};
startServer();
