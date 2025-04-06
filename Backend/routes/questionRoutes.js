const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const moment = require("moment-timezone");

// Mock admin check middleware
const isAdmin = (req) => {
    console.log("🔍 Admin Header:", req.headers['admin']); //  Debug log
    return req.headers['admin'] === 'true';
};

// Fetch all questions (Admins see expired ones too)
router.get('/questions', async (req, res) => {
    try {
        const nowIST = moment().tz("Asia/Kolkata").toDate();
        const isAdminUser = isAdmin(req);

        const query = isAdminUser 
            ? {} 
            : {
                $or: [
                    { deadline: { $exists: false } },
                    { deadline: { $gte: nowIST } }
                ]
            };  

        const questions = await Question.find(query, '-__v');
            
        const formattedQuestions = questions.map(q => ({
            ...q._doc,
            deadline: q.deadline 
                ? moment.utc(q.deadline).tz("Asia/Kolkata").format("YYYY-MM-DD")  // ✅ Convert to YYYY-MM-DD format
                : null
        }));

        res.json(formattedQuestions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Fetch a question by title
router.get('/questions/:title', async (req, res) => {
    try {
        const title = decodeURIComponent(req.params.title);

        // Escape regex characters
        const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regexTitle = new RegExp(`^${escapeRegex(title)}$`, "i");

        const question = await Question.findOne({ title: regexTitle });

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.json({
            ...question._doc,
            deadline: question.deadline 
                ? moment.utc(question.deadline).tz("Asia/Kolkata").format("YYYY-MM-DD")
                : null
        });
        
    } catch (error) {
        console.error("Error fetching question:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Add a new question
router.post('/questions', async (req, res) => {
    try {
        const { title, question, language, description, difficulty, testCases, deadline } = req.body;

        if (!title || !question || !description || !difficulty || !language) {
            return res.status(400).json({ message: 'Title, question, description, language, and difficulty are required' });
        }

        if (testCases && (!Array.isArray(testCases) || testCases.some(tc => !tc.input || !tc.expectedOutput))) {
            return res.status(400).json({ message: 'Invalid testCases format' });
        }

        let deadlineDate = deadline ? moment(deadline, "YYYY-MM-DD").toDate() : null;

        const newQuestion = new Question({
            title,
            question,
            language,
            description,
            difficulty,
            testCases: testCases || [],
            deadline: deadlineDate
        });

        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Error saving question:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Delete a question by ID (Only Admins)
router.delete('/questions/:id', async (req, res) => {
    try {
        if (!isAdmin(req)) {
            console.log("❌ Admin access denied");
            return res.status(403).json({ message: "Access Denied. Only admins can delete questions." });
        }

        const questionId = req.params.id;
        console.log("🔍 Attempting to delete question with ID:", questionId);

        if (!questionId.match(/^[0-9a-fA-F]{24}$/)) {
            console.log("❌ Invalid question ID format");
            return res.status(400).json({ message: "Invalid question ID format" });
        }

        const question = await Question.findById(questionId);
        console.log("🔍 Found question:", question);

        if (!question) {
            console.log("❌ Question not found");
            return res.status(404).json({ message: "Question not found" });
        }

        const deleteResult = await Question.deleteOne({ _id: questionId });
        console.log("✅ Delete Result:", deleteResult);

        if (deleteResult.deletedCount === 0) {
            return res.status(500).json({ message: "❌ Deletion failed" });
        }

        res.json({ message: "✅ Question deleted successfully" });

    } catch (error) {
        console.error("❌ Error deleting question:", error);
        res.status(500).json({ message: "❌ Internal Server Error", error: error.message });
    }
});


module.exports = router;
