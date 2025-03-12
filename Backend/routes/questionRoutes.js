const express = require('express');
const router = express.Router();
const Question = require('../models/Question'); // Ensure this path is correct

// ✅ POST: Add a new question
router.post('/questions', async (req, res) => {
    try {
        const { status, title, solution, acceptance, difficulty } = req.body;

        // Basic validation
        if (!status || !title || !solution || acceptance === undefined || !difficulty) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newQuestion = new Question({ status, title, solution, acceptance, difficulty });
        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Error saving question:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// ✅ GET: Fetch all questions
router.get('/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

module.exports = router;
