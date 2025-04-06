const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    username: { type: String, required: true },
    code: { type: String, required: true },
    time: { type: Date, default: Date.now },
    status: { type: String, required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    executionTime: { type: Number }, 
    memoryUsed: { type: Number }  
     
});

module.exports = mongoose.model("Submission", submissionSchema);
