const mongoose = require('mongoose');

// ✅ Define TestCase Schema
const TestCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true }
});

// ✅ Define Question Schema
const QuestionSchema = new mongoose.Schema({
    
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true // Ensuring uniqueness for better integrity
    },
    question: {  // ✅ Add question field
        type: String,
        required: true
    },
    description: {  // ✅ Add description field
        type: String,
        required: true
    },
    
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    testCases: { type: [TestCaseSchema], default: [] }  // ✅ Add test cases array
}, { timestamps: true }); // ✅ Adds createdAt & updatedAt fields automatically

// ✅ Export Model
module.exports = mongoose.model('Question', QuestionSchema);
