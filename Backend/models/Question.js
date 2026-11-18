const mongoose = require("mongoose");

const TestCaseSchema = new mongoose.Schema({
    input: { type: String, default: "" },
    expectedOutput: { type: String, default: "" },
    // Hidden cases are used for grading only and are never sent to students.
    hidden: { type: Boolean, default: false },
    weight: { type: Number, default: 1, min: 0 },
});

const QuestionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, unique: true, maxlength: 200 },
        question: { type: String, required: true },
        language: { type: String, trim: true }, // legacy free-text field, kept for compatibility
        description: { type: String, required: true },
        difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
        tags: { type: [String], default: [] },
        testCases: { type: [TestCaseSchema], default: [] },
        timeLimitMs: { type: Number, default: 2000, min: 100, max: 15000 },
        memoryLimitMb: { type: Number, default: 256, min: 16, max: 1024 },
        // "trimmed": ignore trailing whitespace per line and trailing blank lines. "tokens": ignore all whitespace differences.
        compareMode: { type: String, enum: ["trimmed", "tokens"], default: "trimmed" },
        deadline: { type: Date },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

QuestionSchema.index({ deadline: 1 });

module.exports = mongoose.model("Question", QuestionSchema);
