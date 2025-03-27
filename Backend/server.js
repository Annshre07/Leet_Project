const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const connectDB = require("./config/db");
const { generateFile } = require("./utils/generateFile");
const { executeCpp } = require("./utils/executeCpp");
const Submission = require("./models/Submission"); // ✅ Correct Model Import

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

// ✅ POST API: Save a new submission
app.post("/api/submissions", async (req, res) => {
    try {
        const { username, code, time, status, questionId } = req.body; // ✅ Added questionId

        if (!username || !code || !time || !status || !questionId) { // ✅ Ensure questionId is required
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newSubmission = new Submission({ username, code, time, status, questionId }); // ✅ Store questionId
        await newSubmission.save();

        res.status(201).json({ message: "Submission saved successfully!" });
    } catch (error) {
        console.error("Error saving submission:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ GET API: Fetch all submissions OR filter by questionId
app.get("/api/submissions", async (req, res) => {
    try {
        const { questionId } = req.query; // ✅ Get questionId from query parameters
        const filter = questionId ? { questionId } : {}; // ✅ Filter if questionId is provided

        const submissions = await Submission.find(filter).sort({ createdAt: -1 });
        res.status(200).json(submissions);
    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Fetch Submissions by Username
app.get("/api/submissions/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const submissions = await Submission.find({ username }).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
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
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
