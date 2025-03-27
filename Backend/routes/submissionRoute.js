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
router.post("/submissions", authMiddleware, async (req, res) => {
    try {
        const { code, language, status, questionId } = req.body;

        if (!questionId) {
            return res.status(400).json({ message: "questionId is required" });
        }

        // Ensure authenticated user data is used
        const username = req.user.username;

        const newSubmission = new Submission({
            username,  // Get username from authenticated user
            code,
            language,
            time: new Date(),
            status,
            questionId // ✅ Save questionId in submission
        });

        await newSubmission.save();
        res.status(201).json(newSubmission);
    } catch (error) {
        console.error("Error saving submission:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
