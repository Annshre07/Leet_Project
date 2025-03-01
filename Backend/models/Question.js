const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['Pending', 'Solved', 'Attempted'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    solution: {
        type: String,
        required: true
    },
    acceptance: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
