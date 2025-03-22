const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const connectDB = require("./config/db");
const { generateFile } = require("./utils/generateFile");
const { executeCpp } = require("./utils/executeCpp");

const app = express();

// ✅ CORS Configuration
const corsOptions = {
    origin: ["http://localhost:3000"], // Adjust based on your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Connect to MongoDB
connectDB();
const conn = mongoose.connection;
let bucket;

// ✅ Initialize GridFSBucket when DB is connected
conn.once("open", () => {
    bucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    console.log("📂 GridFS initialized");
});

// ✅ Import Routes
const authRoutes = require("./routes/authRoutes");
const codeRoutes = require("./routes/codeRoutes");
const questionRoutes = require("./routes/questionRoutes");
const adminRoutes = require("./routes/adminRoutes");

// ✅ Use Routes
app.use("/api", questionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/code", codeRoutes);

// ✅ Root Route
app.get("/", (req, res) => {
    return res.json("Hello There! Server is running...");
});

// ✅ Store & Execute Code
app.post("/run", async (req, res) => {
    console.log("📥 Incoming Request:", req.body);
    const { language = "cpp", code, testCases = [] } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, error: "⚠️ Code input is required" });
    }

    try {
        const fileId = await generateFile(language, code);
        console.log("✅ File stored with ID:", fileId);

        // ✅ Stream execution output
        executeCpp(fileId, res, testCases);
    } catch (err) {
        console.error("❌ Execution Error:", err);
        return res.status(500).json({ success: false, error: "Execution failed", details: err.message });
    }
});

// ✅ Fetch & Execute Stored Code
app.get("/execute/:id", async (req, res) => {
    const { id } = req.params;

    res.setHeader("Content-Type", "text/plain");
    executeCpp(id, res);
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
};
startServer();
