const express = require("express");
const Question = require("../models/Question");
const { authMiddleware } = require("../middleware/authMiddleware");
const { runLimiter } = require("../middleware/rateLimit");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { requireString, isStr, objectIdRe } = require("../utils/validators");

const router = express.Router();
router.use(authMiddleware);

router.get("/languages", asyncHandler(async (req, res) => {
    res.json({ mode: req.app.locals.judge.cfg.mode, languages: await req.app.locals.judge.languages() });
}));

// "Run": execute with custom input. Never graded, never stored as a submission.
router.post("/run", runLimiter, asyncHandler(async (req, res) => {
    const { language, questionId } = req.body;
    const code = requireString(req.body.code, "Code", { max: 65536 });
    const input = req.body.input === undefined ? "" : req.body.input;
    if (!isStr(input) || input.length > 100000) throw new HttpError(400, "Input must be text of at most 100,000 characters");
    if (!isStr(language)) throw new HttpError(400, "Language is required");

    let limits = {};
    if (questionId !== undefined) {
        if (!isStr(questionId) || !objectIdRe.test(questionId)) throw new HttpError(400, "Invalid question id");
        const q = await Question.findById(questionId, "timeLimitMs memoryLimitMb");
        if (!q) throw new HttpError(404, "Question not found");
        limits = { timeLimitMs: q.timeLimitMs, memoryLimitMb: q.memoryLimitMb };
    }
    res.json(await req.app.locals.judge.run({ language, code, input, ...limits }));
}));

module.exports = router;
