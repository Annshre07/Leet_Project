const express = require("express");
const Question = require("../models/Question");
const Submission = require("../models/Submission");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const audit = require("../services/audit");
const { parseDeadline, formatDeadline, startOfTodayIST, isExpired } = require("../utils/time");
const { requireString, requireObjectId, objectIdRe, isStr } = require("../utils/validators");

const router = express.Router();
const isStaff = (req) => req.role === "admin" || req.role === "teacher";
const MAX_TESTS = 100;

const summary = (q) => ({
    _id: q._id,
    title: q.title,
    difficulty: q.difficulty,
    language: q.language,
    tags: q.tags || [],
    deadline: formatDeadline(q.deadline),
    testCaseCount: (q.testCases || []).length,
});

// Students only ever receive sample (non-hidden) cases. Hidden cases and weights stay on the server.
const detail = (q, staff) => ({
    _id: q._id,
    title: q.title,
    question: q.question,
    description: q.description,
    difficulty: q.difficulty,
    language: q.language,
    tags: q.tags || [],
    timeLimitMs: q.timeLimitMs,
    memoryLimitMb: q.memoryLimitMb,
    compareMode: q.compareMode,
    deadline: formatDeadline(q.deadline),
    expired: isExpired(q.deadline),
    createdBy: q.createdBy,
    testCases: (q.testCases || [])
        .filter((t) => staff || !t.hidden)
        .map((t) => (staff ? { _id: t._id, input: t.input, expectedOutput: t.expectedOutput, hidden: !!t.hidden, weight: t.weight ?? 1 } : { input: t.input, expectedOutput: t.expectedOutput })),
    hiddenTestCount: (q.testCases || []).filter((t) => t.hidden).length,
});

function parseQuestionBody(body, { partial = false } = {}) {
    const out = {};
    const need = (k, label, max) => { if (!partial || body[k] !== undefined) out[k] = requireString(body[k], label, { max }).trim(); };
    need("title", "Title", 200);
    need("question", "Question", 20000);
    need("description", "Description", 20000);
    if (!partial || body.difficulty !== undefined) {
        if (!["Easy", "Medium", "Hard"].includes(body.difficulty)) throw new HttpError(400, "Difficulty must be Easy, Medium or Hard");
        out.difficulty = body.difficulty;
    }
    if (body.language !== undefined) out.language = isStr(body.language) ? body.language.trim().slice(0, 40) : undefined;
    if (body.tags !== undefined) {
        if (!Array.isArray(body.tags) || body.tags.some((t) => !isStr(t))) throw new HttpError(400, "tags must be an array of strings");
        out.tags = body.tags.map((t) => t.trim()).filter(Boolean).slice(0, 20);
    }
    if (body.deadline !== undefined) {
        const d = parseDeadline(body.deadline || null);
        if (d === undefined) throw new HttpError(400, "Deadline must be a date in YYYY-MM-DD format");
        out.deadline = d;
    }
    for (const [k, min, max] of [["timeLimitMs", 100, 15000], ["memoryLimitMb", 16, 1024]]) {
        if (body[k] !== undefined) {
            const n = Number(body[k]);
            if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `${k} must be between ${min} and ${max}`);
            out[k] = n;
        }
    }
    if (body.compareMode !== undefined) {
        if (!["trimmed", "tokens"].includes(body.compareMode)) throw new HttpError(400, "compareMode must be trimmed or tokens");
        out.compareMode = body.compareMode;
    }
    if (!partial || body.testCases !== undefined) {
        const tcs = body.testCases ?? [];
        if (!Array.isArray(tcs) || tcs.length > MAX_TESTS) throw new HttpError(400, `testCases must be an array of at most ${MAX_TESTS} items`);
        out.testCases = tcs.map((t, i) => {
            if (!t || !isStr(t.input ?? "") || !isStr(t.expectedOutput) || !t.expectedOutput.trim()) throw new HttpError(400, `Test case ${i + 1} needs an expected output`);
            if ((t.input || "").length > 100000 || t.expectedOutput.length > 100000) throw new HttpError(400, `Test case ${i + 1} is too large`);
            const weight = t.weight === undefined ? 1 : Number(t.weight);
            if (!Number.isFinite(weight) || weight < 0) throw new HttpError(400, `Test case ${i + 1} has an invalid weight`);
            return { input: t.input || "", expectedOutput: t.expectedOutput, hidden: !!t.hidden, weight };
        });
    }
    return out;
}

router.use(authMiddleware);

router.get("/", asyncHandler(async (req, res) => {
    // Students do not see questions whose deadline day has passed. Legacy rows (midnight) and new rows (end of day) both compare correctly.
    const query = isStaff(req) ? {} : { $or: [{ deadline: { $exists: false } }, { deadline: null }, { deadline: { $gte: startOfTodayIST() } }] };
    const questions = await Question.find(query, "title difficulty language tags deadline testCases.hidden createdAt").sort({ createdAt: 1 }).lean();
    res.json(questions.map(summary));
}));

// :key is either a Mongo id or (legacy) a title
router.get("/:key", asyncHandler(async (req, res) => {
    const key = decodeURIComponent(req.params.key);
    const q = objectIdRe.test(key) ? await Question.findById(key) : await Question.findOne({ title: key }).collation({ locale: "en", strength: 2 });
    if (!q) throw new HttpError(404, "Question not found");
    res.json(detail(q, isStaff(req)));
}));

router.post("/", ...requireRole("admin", "teacher"), asyncHandler(async (req, res) => {
    const data = parseQuestionBody(req.body);
    if (data.testCases.length === 0) throw new HttpError(400, "At least one test case is required");
    const q = await Question.create({ ...data, createdBy: req.user._id });
    await audit(req.user, "problem.created", q._id, { title: q.title });
    res.status(201).json(detail(q, true));
}));

router.put("/:id", ...requireRole("admin", "teacher"), asyncHandler(async (req, res) => {
    requireObjectId(req.params.id, "question id");
    const q = await Question.findById(req.params.id);
    if (!q) throw new HttpError(404, "Question not found");
    if (req.role === "teacher" && String(q.createdBy) !== String(req.user._id)) throw new HttpError(403, "You can only edit problems you created");
    const data = parseQuestionBody(req.body, { partial: true });
    if (data.testCases && data.testCases.length === 0) throw new HttpError(400, "At least one test case is required");
    q.set(data);
    await q.save();
    await audit(req.user, "problem.updated", q._id, { fields: Object.keys(data) });
    res.json(detail(q, true));
}));

router.delete("/:id", ...requireRole("admin"), asyncHandler(async (req, res) => {
    requireObjectId(req.params.id, "question id");
    const q = await Question.findById(req.params.id);
    if (!q) throw new HttpError(404, "Question not found");
    const subs = await Submission.countDocuments({ questionId: q._id });
    if (subs > 0 && req.query.force !== "true") {
        throw new HttpError(409, `This question has ${subs} submission(s). Deleting it also deletes them.`, { submissions: subs });
    }
    await Submission.deleteMany({ questionId: q._id });
    await q.deleteOne();
    await audit(req.user, "problem.deleted", q._id, { title: q.title, submissionsDeleted: subs });
    res.json({ message: "Question deleted", submissionsDeleted: subs });
}));

module.exports = router;
module.exports.detail = detail;
module.exports.parseQuestionBody = parseQuestionBody;
