const express = require('express');
const router = express.Router();
const Question = require('../models/Question'); // Ensure this path is correct

// ✅ GET: Fetch all questions
router.get('/questions', async (req, res) => {
    try {
        const questions = await Question.find({}, '-__v'); // Exclude `__v`
        res.json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// ✅ GET: Fetch a specific question by title
router.get('/questions/:title', async (req, res) => {
    try {
        const title = decodeURIComponent(req.params.title); // Decode URL encoding
        console.log("Searching for question:", title); // Debugging

        const question = await Question.findOne({ title: new RegExp(`^${title}$`, "i") }); // Case-insensitive

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.json(question);
    } catch (error) {
        console.error("Error fetching question:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// ✅ POST: Add a new question (Only required fields)
router.post('/questions', async (req, res) => {
    try {
        const { title, question,language, description, difficulty, testCases } = req.body;

        // ✅ Validate required fields
        if (!title || !question || !description || !difficulty || !language) {
            return res.status(400).json({ message: 'Title, question, description,language and difficulty are required' });
        }

        // ✅ Validate testCases format (if provided)
        if (testCases && (!Array.isArray(testCases) || testCases.some(tc => !tc.input || !tc.expectedOutput))) {
            return res.status(400).json({ message: 'Invalid testCases format' });
        }

        const newQuestion = new Question({
            title,
            question,
            language,
            description,
            difficulty,
            testCases: testCases || [] // Default to an empty array
        });

        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Error saving question:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

module.exports = router;
