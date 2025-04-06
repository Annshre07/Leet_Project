const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const { authMiddleware } = require("../middlewares/authMiddleware");

// ✅ GET: Fetch submissions (filtered by questionId if provided)
router.get("/submissions", async (req, res) => {
    const { questionId } = req.query; // ✅ Get questionId from request query
    
    try {
        const filter = questionId ? { questionId } : {}; // ✅ Filter by questionId
        const submissions = await Submission.find(filter);
        res.json(submissions);
    } catch (err) {
        console.error("Error fetching submissions:", err);
        res.status(500).json({ error: "Error fetching submissions" });
    }
});

// ✅ POST: Add a new submission (Requires authentication)
// In routes/submissionRoutes.js
router.post("/submissions", authMiddleware, async (req, res) => {
    try {
        const { code, language, status, questionId, executionTime, memoryUsed } = req.body;

        if (!questionId) {
            return res.status(400).json({ message: "questionId is required" });
        }

        // Ensure authenticated user data is used
        const username = req.user.username;

        // Create a new submission including the execution metrics
        const newSubmission = new Submission({
            username,  
            code,
            language,
            time: new Date(),
            status,
            questionId,
            executionTime, // e.g., "378.63 ms"
            memoryUsed     // e.g., "8.00 KB"
        });

        await newSubmission.save();
        res.status(201).json(newSubmission);
    } catch (error) {
        console.error("Error saving submission:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
