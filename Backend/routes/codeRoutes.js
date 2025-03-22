const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { generateFile } = require('../utils/generateFile');
const { executeCpp } = require('../utils/executeCpp');

// ✅ Function to execute test cases
const runTestCases = async (language, code, testCases) => {
    try {
        const results = await Promise.all(
            testCases.map(async ({ input, expectedOutput }) => {
                let variables;
                try {
                    variables = typeof input === "string" ? JSON.parse(input) : input;
                } catch (error) {
                    console.error("Invalid JSON input:", input);
                    return { error: "Invalid JSON input" };
                }

                const modifiedCode = code
                    .replace(/int\s+a\s*=\s*\d+\s*;/, `int a = ${variables.a};`)
                    .replace(/int\s+b\s*=\s*\d+\s*;/, `int b = ${variables.b};`);

                console.log("🔹 Modified Code:", modifiedCode);

                // Generate file with modified code (in memory)
                const filepath = await generateFile(language, modifiedCode);

                // Execute based on language
                let output;
                if (language === "cpp" || language === "c") {
                    output = await executeCpp(filepath);
                } else if (language === "python") {
                    output = await executePython(filepath);
                } else {
                    throw new Error(`Unsupported language: ${language}`);
                }

                return {
                    input,
                    expectedOutput,
                    actualOutput: output.trim(),
                    passed: output.trim() === expectedOutput.trim()
                };
            })
        );

        return results;
    } catch (error) {
        return { error: error.message };
    }
};



// ✅ POST: Add a new question and validate test cases
router.post('/questions', async (req, res) => {
    try {
        const { title, question, description, difficulty, testCases, language } = req.body;

        // ✅ Validate required fields
        if (!title || !question || !description || !difficulty || !language) {
            return res.status(400).json({ message: 'Title, question, description, difficulty, and language are required' });
        }

        // ✅ Validate testCases format
        if (testCases && (!Array.isArray(testCases) || testCases.some(tc => !tc.input || !tc.expectedOutput))) {
            return res.status(400).json({ message: 'Invalid testCases format' });
        }

        // ✅ Execute test cases before saving
        const testResults = await runTestCases(language, question, testCases || []);

        // ✅ Store question in database
        const newQuestion = new Question({
            title,
            question,
            description,
            difficulty,
            testCases
        });

        await newQuestion.save();
        res.status(201).json({ question: newQuestion, testResults });

    } catch (error) {
        console.error("Error saving question:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

module.exports = router;
