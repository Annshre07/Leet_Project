const mongoose = require("mongoose");

const VERDICTS = [
    "Accepted", "Wrong Answer", "Compilation Error", "Runtime Error",
    "Time Limit Exceeded", "Memory Limit Exceeded", "Internal Error", "Pending", "Processing",
];

const ResultSchema = new mongoose.Schema(
    {
        index: Number,
        hidden: Boolean,
        verdict: { type: String, enum: VERDICTS },
        timeMs: Number,
        memoryKb: Number,
        weight: Number,
    },
    { _id: false }
);

const submissionSchema = new mongoose.Schema(
    {
        // Legacy (Labyrinth 1.x) rows only have `username` and a client-reported `status`.
        username: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
        language: { type: String, default: "cpp" },
        code: { type: String, required: true, maxlength: 65536 },
        time: { type: Date, default: Date.now },

        status: { type: String, required: true }, // "Passed" | "Failed" (kept for old UI/data)
        verdict: { type: String, enum: VERDICTS },
        score: { type: Number, min: 0, max: 100 }, // percentage of test weight passed
        passedCount: Number,
        totalCount: Number,
        results: [ResultSchema],
        compileOutput: { type: String, maxlength: 4000 },
        executionTime: { type: Number }, // ms, max over test cases
        memoryUsed: { type: Number }, // KB, max over test cases
        // true = produced by the server-side judge. Legacy rows were graded in the browser and are untrusted.
        serverVerified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

submissionSchema.index({ user: 1, questionId: 1, createdAt: -1 });
submissionSchema.index({ questionId: 1, createdAt: -1 });

const Submission = mongoose.model("Submission", submissionSchema);
Submission.VERDICTS = VERDICTS;
module.exports = Submission;
