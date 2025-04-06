const mongoose = require('mongoose');
const moment = require('moment-timezone');

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
        required:true,
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
    testCases: { type: [TestCaseSchema], default: [] },
   // Store deadline as a Date type
    deadline: { type: Date, required: false }  
}, { timestamps: true }); 

module.exports = mongoose.model('Question', QuestionSchema);