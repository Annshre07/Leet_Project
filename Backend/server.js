const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const { generateFile } = require('./utils/generateFile');
const { executeCpp } = require("./utils/executeCpp");

const app = express();
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const codeRoutes = require('./routes/codeRoutes');
const questionRoutes = require('./routes/questionRoutes');

app.use('/api', questionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/code', codeRoutes);

// Root Route
app.get('/', (req, res) => {
    return res.json("Hello There! Server is running...");
});
app.post("/run", async (req, res) => {
    console.log(req.body); // For debugging
    const { language = "cpp", code } = req.body;
    console.log(code); // Debugging output

    if (!code) {
        return res.status(400).json({ success: false, error: "Code input is required" });
    }

    try {
        const filepath = await generateFile(language, code);
        const output = await executeCpp(filepath);
        return res.json({ filepath, output });
    } catch (err) {
        return res.status(500).json({ success: false, error: "Execution failed", details: err.message });
    }
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




