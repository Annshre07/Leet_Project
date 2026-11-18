const { test } = require("node:test");
const assert = require("node:assert/strict");
const { outputsMatch } = require("../services/judge/compare");
const { loadConfig } = require("../config/env");
const { clean } = require("../middleware/sanitize");
const JobQueue = require("../services/judge/queue");
const { summarise } = require("../services/gradingService");
const { parseDeadline, formatDeadline, isExpired } = require("../utils/time");
const { passwordProblem } = require("../utils/validators");

const base = { MONGO_URI: "mongodb://x", JWT_SECRET: "a".repeat(40) };

test("compare: trailing whitespace and CRLF are ignored, case and inner spacing are not", () => {
    assert.ok(outputsMatch("3\r\n", "3"));
    assert.ok(outputsMatch("a b  \nc\n\n", "a b\nc"));
    assert.ok(!outputsMatch("Yes", "yes"));
    assert.ok(!outputsMatch("1 2", "1  2"));
    assert.ok(!outputsMatch("3;", "3"), "old client check silently dropped a trailing ';'");
    assert.ok(outputsMatch("1   2\n3", "1 2 3", "tokens"));
});

test("config: refuses missing, short and legacy secrets", () => {
    assert.throws(() => loadConfig({ MONGO_URI: "x" }), /JWT_SECRET is required/);
    assert.throws(() => loadConfig({ ...base, JWT_SECRET: "short" }), /at least 32/);
    assert.throws(() => loadConfig({ MONGO_URI: "x" }), /CONFIG|Invalid configuration/);
    assert.equal(loadConfig(base).judge.mode, "local");
});

test("config: local judge is refused in production unless explicitly overridden", () => {
    assert.throws(() => loadConfig({ ...base, NODE_ENV: "production", JUDGE_MODE: "local" }), /refused in production/);
    assert.equal(loadConfig({ ...base, NODE_ENV: "production" }).judge.mode, "docker");
    assert.equal(loadConfig({ ...base, NODE_ENV: "production", JUDGE_MODE: "local", ALLOW_UNSAFE_LOCAL_JUDGE: "true" }).judge.mode, "local");
});

test("sanitize: operator and dotted keys are removed", () => {
    assert.deepEqual(clean({ email: { $gt: "" }, a: { "b.c": 1, ok: [{ $ne: 1, x: 2 }] } }), { email: {}, a: { ok: [{ x: 2 }] } });
});

test("queue: respects concurrency and rejects when full", async () => {
    const q = new JobQueue({ concurrency: 1, maxQueue: 1 });
    let release; const gate = new Promise((r) => (release = r));
    const a = q.run(() => gate);
    const b = q.run(async () => "b");
    await assert.rejects(q.run(async () => "c"), (e) => e.status === 503);
    assert.equal(q.stats().active, 1);
    release(1);
    await a; assert.equal(await b, "b");
});

test("grading: weighted partial score and verdict of first failure", () => {
    const r = [
        { index: 0, verdict: "Accepted", weight: 1, timeMs: 5, memoryKb: 100 },
        { index: 1, verdict: "Wrong Answer", weight: 3, timeMs: 7, memoryKb: 120 },
        { index: 2, verdict: "Accepted", weight: 1, timeMs: 1, memoryKb: 90 },
    ];
    const s = summarise({ results: r });
    assert.equal(s.verdict, "Wrong Answer");
    assert.equal(s.score, 40);
    assert.equal(s.passedCount, 2);
    assert.equal(s.executionTime, 7);
    assert.equal(summarise({ results: r.map((x) => ({ ...x, verdict: "Accepted", weight: 1 })) }).score, 100);
    assert.equal(summarise({ compileError: "boom", results: [] }).verdict, "Compilation Error");
});

test("grading: ten equal-weight cases, seven passing = 70", () => {
    const results = Array.from({ length: 10 }, (_, i) => ({ index: i, verdict: i < 7 ? "Accepted" : "Wrong Answer", weight: 1 }));
    assert.equal(summarise({ results }).score, 70);
});

test("deadline: valid through the end of the IST day, legacy midnight rows behave the same", () => {
    const d = parseDeadline("2026-03-10");
    assert.equal(formatDeadline(d), "2026-03-10");
    assert.ok(!isExpired(d, new Date("2026-03-10T18:00:00Z"))); // 23:30 IST
    assert.ok(isExpired(d, new Date("2026-03-10T18:31:00Z"))); // 00:01 IST next day
    const legacy = new Date("2026-03-10T00:00:00Z");
    assert.ok(!isExpired(legacy, new Date("2026-03-10T12:00:00Z")));
    assert.equal(parseDeadline("not-a-date"), undefined);
    assert.equal(parseDeadline(""), null);
});

test("password policy", () => {
    assert.ok(passwordProblem("short1"));
    assert.ok(passwordProblem("alllettersnodigit"));
    assert.ok(passwordProblem(undefined));
    assert.equal(passwordProblem("Abcdefg1"), null);
});
