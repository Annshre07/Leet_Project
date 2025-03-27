const mongoose = require('mongoose');
const TestCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true }
});
const QuestionSchema = new mongoose.Schema({
    
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true 
    },
    question: { 
        type: String,
        required: true
    },
    language:{
        type:String,
        rquired:true,
    },
    description: {  
        type: String,
        required: true
    },
    
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    testCases: { type: [TestCaseSchema], default: [] } 
}, { timestamps: true }); 
module.exports = mongoose.model('Question', QuestionSchema);
