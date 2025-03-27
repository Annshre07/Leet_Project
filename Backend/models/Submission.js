const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    username: String,
    code: String,
    time: { type: Date, default: Date.now },
    status: String,
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true } 
});

module.exports = mongoose.model("Submission", submissionSchema);
