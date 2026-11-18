const express = require("express");
const Question = require("../models/Question");
const Submission = require("../models/Submission");
const { authMiddleware } = require("../middleware/authMiddleware");
const { submitLimiter } = require("../middleware/rateLimit");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { summarise } = require("../services/gradingService");
const { isExpired } = require("../utils/time");
const { requireString, requireObjectId, parsePaging, isStr } = require("../utils/validators");

const router = express.Router();
router.use(authMiddleware);
const isStaff = (req) => req.role === "admin" || req.role === "teacher";

const listItem = (s) => ({
    _id: s._id,
    username: s.username,
    questionId: s.questionId,
    language: s.language,
    time: s.time || s.createdAt,
    verdict: s.verdict || (s.status === "Passed" ? "Accepted" : "Wrong Answer"),
    status: s.status,
    score: s.score,
    passedCount: s.passedCount,
    totalCount: s.totalCount,
    executionTime: s.executionTime,
    memoryUsed: s.memoryUsed,
    serverVerified: !!s.serverVerified,
});

// "Submit": the server grades against ALL test cases (including hidden ones). Nothing the client sends decides the result.
router.post("/", submitLimiter, asyncHandler(async (req, res) => {
    const questionId = requireObjectId(req.body.questionId, "question id");
    const code = requireString(req.body.code, "Code", { max: 65536 });
    if (!isStr(req.body.language)) throw new HttpError(400, "Language is required");

    const q = await Question.findById(questionId);
    if (!q) throw new HttpError(404, "Question not found");
    if (!isStaff(req) && isExpired(q.deadline)) throw new HttpError(403, "The deadline for this question has passed");
    if (!q.testCases.length) throw new HttpError(400, "This question has no test cases yet");

    const raw = await req.app.locals.judge.grade({
        language: req.body.language,
        code,
        tests: q.testCases.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput, hidden: t.hidden, weight: t.weight })),
        timeLimitMs: q.timeLimitMs,
        memoryLimitMb: q.memoryLimitMb,
        compareMode: q.compareMode,
    });
    const s = summarise(raw);

    const saved = await Submission.create({
        user: req.user._id,
        username: req.user.username,
        questionId: q._id,
        language: req.body.language,
        code,
        status: s.verdict === "Accepted" ? "Passed" : "Failed",
        verdict: s.verdict,
        score: s.score,
        passedCount: s.passedCount,
        totalCount: s.totalCount,
        results: s.results,
        compileOutput: s.compileOutput,
        executionTime: s.executionTime,
        memoryUsed: s.memoryUsed,
        serverVerified: true,
    });

    // Hidden cases are reported by index and verdict only: no input, expected output or program output.
    const sampleDetails = raw.results
        .filter((r) => !r.hidden)
        .map((r) => ({ index: r.index, stdout: r.stdout?.slice(0, 2000), stderr: r.stderr?.slice(0, 2000) }));
    res.status(201).json({ ...listItem(saved), compileOutput: s.compileOutput, results: s.results, sampleDetails });
}));

router.get("/", asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePaging(req.query);
    const filter = {};
    if (req.query.questionId) filter.questionId = requireObjectId(String(req.query.questionId), "question id");
    // Students only ever see their own submissions; staff may filter by user.
    if (!isStaff(req)) filter.user = req.user._id;
    else if (req.query.userId) filter.user = requireObjectId(String(req.query.userId), "user id");
    if (req.query.verdict && Submission.VERDICTS.includes(String(req.query.verdict))) filter.verdict = String(req.query.verdict);

    const [items, total] = await Promise.all([
        Submission.find(filter, "-code -results -compileOutput").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Submission.countDocuments(filter),
    ]);
    res.json({ items: items.map(listItem), total, page, limit });
}));

router.get("/:id", asyncHandler(async (req, res) => {
    requireObjectId(req.params.id, "submission id");
    const s = await Submission.findById(req.params.id).lean();
    // Same response for "missing" and "not yours" so ids cannot be probed.
    if (!s || (!isStaff(req) && String(s.user) !== String(req.user._id))) throw new HttpError(404, "Submission not found");
    res.json({ ...listItem(s), code: s.code, compileOutput: s.compileOutput, results: s.results });
}));

module.exports = router;
