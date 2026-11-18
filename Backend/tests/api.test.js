// API tests: real Express app + real judge, MongoDB models stubbed (no database is available in this environment).
const { test, beforeEach, before } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { api, judge, query, makeUser, loginAs, resetUsers, installUserStub, mock, config } = require("./helpers");
const User = require("../models/User");
const Question = require("../models/Question");
const Submission = require("../models/Submission");
const AuditLog = require("../models/AuditLog");
const { parseDeadline } = require("../utils/time");

const SUM_OK = '#include <iostream>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}';
const SUM_BAD = '#include <iostream>\nint main(){std::cout<<3;}'; // passes only the sample "1 2 -> 3"

const makeQuestion = (extra = {}) =>
    new Question({
        title: "Add", question: "Add two numbers", description: "d", difficulty: "Easy",
        testCases: [
            { input: "1 2", expectedOutput: "3" },
            { input: "SECRET-HIDDEN-INPUT 10 20", expectedOutput: "SECRET-HIDDEN-OUTPUT", hidden: true },
        ],
        ...extra,
    });
// A question whose hidden case is genuinely solvable so correct code gets Accepted.
const solvableQuestion = () => makeQuestion({ testCases: [{ input: "1 2", expectedOutput: "3" }, { input: "10 20", expectedOutput: "30", hidden: true }] });

let student, other, teacher, admin, saved, auditCalls;
before(async () => { await judge.languages(); });
beforeEach(() => {
    resetUsers();
    student = makeUser("student"); other = makeUser("student", { email: "s2@example.com" });
    teacher = makeUser("teacher"); admin = makeUser("admin");
    saved = [];
    auditCalls = [];
    mock.restoreAll();
    installUserStub();
    mock.method(AuditLog, "create", async (d) => { auditCalls.push(d); return d; });
});
const H = (u) => ({ Authorization: loginAs(u).Authorization });

test("every data and execution endpoint rejects anonymous callers", async () => {
    for (const [m, p] of [["get", "/api/questions"], ["get", "/api/questions/x"], ["post", "/api/questions"], ["delete", "/api/questions/507f1f77bcf86cd799439011"],
        ["post", "/api/judge/run"], ["get", "/api/judge/languages"], ["post", "/api/submissions"], ["get", "/api/submissions"], ["get", "/api/admin/users"]]) {
        const r = await api()[m](p).send({});
        assert.equal(r.status, 401, `${m.toUpperCase()} ${p}`);
    }
});

test("legacy unauthenticated execution endpoints are gone", async () => {
    assert.equal((await api().post("/run").send({ code: "int main(){}" })).status, 404);
    assert.equal((await api().get("/execute/abc")).status, 404);
});

test("the old 'admin: true' header grants nothing", async () => {
    assert.equal((await api().delete("/api/questions/507f1f77bcf86cd799439011").set("admin", "true")).status, 401);
    assert.equal((await api().post("/api/questions").set("admin", "true").send({ title: "x" })).status, 401);
    const r = await api().delete("/api/questions/507f1f77bcf86cd799439011").set(H(student)).set("admin", "true");
    assert.equal(r.status, 403);
});

test("tokens: wrong secret, alg=none, expired and deleted-user tokens are rejected", async () => {
    const id = String(student._id);
    loginAs(student);
    const bad = jwt.sign({ id }, "some-other-secret-some-other-secret!!");
    assert.equal((await api().get("/api/questions").set("Authorization", `Bearer ${bad}`)).status, 401);
    const none = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url") + "." + Buffer.from(JSON.stringify({ id })).toString("base64url") + ".";
    assert.equal((await api().get("/api/questions").set("Authorization", `Bearer ${none}`)).status, 401);
    const expired = jwt.sign({ id }, config.jwtSecret, { expiresIn: -10 });
    assert.equal((await api().get("/api/questions").set("Authorization", `Bearer ${expired}`)).status, 401);
    resetUsers();
    const ghost = jwt.sign({ id }, config.jwtSecret);
    assert.equal((await api().get("/api/questions").set("Authorization", `Bearer ${ghost}`)).status, 401);
});

test("deactivated accounts and tokens issued before a password change are rejected", async () => {
    const t = jwt.sign({ id: String(student._id) }, config.jwtSecret);
    student.isActive = false;
    loginAs(student);
    assert.equal((await api().get("/api/questions").set("Authorization", `Bearer ${t}`)).status, 401);
    student.isActive = true;
    student.passwordChangedAt = new Date(Date.now() + 60_000);
    assert.equal((await api().get("/api/questions").set("Authorization", `Bearer ${t}`)).status, 401);
});

test("students cannot manage questions; teachers can create", async () => {
    assert.equal((await api().post("/api/questions").set(H(student)).send({})).status, 403);
    assert.equal((await api().delete("/api/questions/507f1f77bcf86cd799439011").set(H(student))).status, 403);
    mock.method(Question, "create", async (d) => new Question(d));
    const body = { title: "T", question: "q", description: "d", difficulty: "Easy", testCases: [{ input: "", expectedOutput: "1" }] };
    const r = await api().post("/api/questions").set(H(teacher)).send(body);
    assert.equal(r.status, 201);
    assert.equal(r.body.testCases[0].input, "", "empty stdin is a valid test input");
});

test("question validation rejects bad difficulty, dates and missing expected output", async () => {
    const ok = { title: "T", question: "q", description: "d", difficulty: "Easy", testCases: [{ input: "1", expectedOutput: "1" }] };
    for (const bad of [{ difficulty: "Impossible" }, { deadline: "10/03/2026" }, { testCases: [{ input: "1", expectedOutput: "  " }] }, { testCases: [] }, { title: "" }, { timeLimitMs: 99999 }]) {
        const r = await api().post("/api/questions").set(H(admin)).send({ ...ok, ...bad });
        assert.equal(r.status, 400, JSON.stringify(bad));
    }
});

test("students never receive hidden test cases; staff do", async () => {
    mock.method(Question, "findById", async () => makeQuestion());
    const id = "507f1f77bcf86cd799439011";
    const s = await api().get(`/api/questions/${id}`).set(H(student));
    assert.equal(s.status, 200);
    assert.equal(s.body.testCases.length, 1);
    assert.equal(s.body.hiddenTestCount, 1);
    assert.ok(!JSON.stringify(s.body).includes("SECRET-HIDDEN"), "hidden data leaked to a student");
    const t = await api().get(`/api/questions/${id}`).set(H(teacher));
    assert.equal(t.body.testCases.length, 2);
    assert.ok(JSON.stringify(t.body).includes("SECRET-HIDDEN-OUTPUT"));
});

test("question list omits test cases entirely", async () => {
    mock.method(Question, "find", () => query([makeQuestion().toObject()]));
    const r = await api().get("/api/questions").set(H(student));
    assert.equal(r.status, 200);
    assert.equal(r.body[0].testCaseCount, 2);
    assert.ok(!("testCases" in r.body[0]));
});

test("teachers can only edit their own problems", async () => {
    const q = makeQuestion({ createdBy: admin._id });
    mock.method(Question, "findById", async () => q);
    const r = await api().put(`/api/questions/${q._id}`).set(H(teacher)).send({ title: "New" });
    assert.equal(r.status, 403);
});

test("deleting a question that has submissions needs explicit force", async () => {
    const q = makeQuestion();
    mock.method(Question, "findById", async () => q);
    mock.method(Submission, "countDocuments", async () => 3);
    const del = mock.method(Submission, "deleteMany", async () => ({}));
    mock.method(q, "deleteOne", async () => ({}));
    assert.equal((await api().delete(`/api/questions/${q._id}`).set(H(admin))).status, 409);
    assert.equal(del.mock.callCount(), 0);
    const r = await api().delete(`/api/questions/${q._id}?force=true`).set(H(admin));
    assert.equal(r.status, 200);
    assert.equal(r.body.submissionsDeleted, 3);
});

test("Run executes with custom stdin and needs no question", async () => {
    const r = await api().post("/api/judge/run").set(H(student)).send({ language: "cpp", code: SUM_OK, input: "40 2" });
    assert.equal(r.status, 200);
    assert.equal(r.body.verdict, "Completed");
    assert.equal(r.body.stdout.trim(), "42");
    const bad = await api().post("/api/judge/run").set(H(student)).send({ language: "brainfuck", code: "+" });
    assert.equal(bad.status, 400);
    assert.equal((await api().post("/api/judge/run").set(H(student)).send({ language: "cpp", code: "" })).status, 400);
});

test("languages endpoint lists only languages that can run", async () => {
    const r = await api().get("/api/judge/languages").set(H(student));
    assert.equal(r.status, 200);
    assert.ok(r.body.languages.length > 0);
    assert.ok(r.body.languages.every((l) => l.template && l.id));
});

test("Submit grades on the server: correct code is Accepted and hidden data stays hidden", async () => {
    const q = solvableQuestion();
    mock.method(Question, "findById", async () => q);
    mock.method(Submission, "create", async (d) => { saved.push(d); return { ...d, _id: "sub1" }; });
    const r = await api().post("/api/submissions").set(H(student)).send({ questionId: String(q._id), language: "cpp", code: SUM_OK });
    assert.equal(r.status, 201);
    assert.equal(r.body.verdict, "Accepted");
    assert.equal(r.body.score, 100);
    assert.equal(saved[0].serverVerified, true);
    assert.equal(String(saved[0].user), String(student._id));
    assert.equal(r.body.results.length, 2);
    assert.equal(r.body.results[1].hidden, true);
    assert.ok(!("input" in r.body.results[1]) && !("expectedOutput" in r.body.results[1]));
    assert.equal(r.body.sampleDetails.length, 1, "output details only for sample cases");
});

test("Submit: client-supplied verdict, score, user and status are ignored", async () => {
    const q = solvableQuestion();
    mock.method(Question, "findById", async () => q);
    mock.method(Submission, "create", async (d) => { saved.push(d); return { ...d, _id: "sub1" }; });
    const r = await api().post("/api/submissions").set(H(student)).send({
        questionId: String(q._id), language: "cpp", code: SUM_BAD,
        status: "Passed", verdict: "Accepted", score: 100, username: "someone_else", user: String(other._id), serverVerified: true,
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.verdict, "Wrong Answer");
    assert.equal(saved[0].status, "Failed");
    assert.equal(saved[0].username, student.username);
    assert.equal(String(saved[0].user), String(student._id));
    assert.ok(r.body.score < 100);
});

test("Submit: compile error is reported with the compiler output", async () => {
    const q = solvableQuestion();
    mock.method(Question, "findById", async () => q);
    mock.method(Submission, "create", async (d) => ({ ...d, _id: "s" }));
    const r = await api().post("/api/submissions").set(H(student)).send({ questionId: String(q._id), language: "cpp", code: "int main({" });
    assert.equal(r.body.verdict, "Compilation Error");
    assert.match(r.body.compileOutput, /error/);
});

test("Submit: refused after the deadline for students, allowed for staff", async () => {
    const q = solvableQuestion();
    q.deadline = parseDeadline("2020-01-01");
    mock.method(Question, "findById", async () => q);
    mock.method(Submission, "create", async (d) => ({ ...d, _id: "s" }));
    const body = { questionId: String(q._id), language: "cpp", code: SUM_OK };
    assert.equal((await api().post("/api/submissions").set(H(student)).send(body)).status, 403);
    assert.equal((await api().post("/api/submissions").set(H(teacher)).send(body)).status, 201);
});

test("Submit: validation (missing code, bad id, unknown language)", async () => {
    const q = solvableQuestion();
    mock.method(Question, "findById", async () => q);
    assert.equal((await api().post("/api/submissions").set(H(student)).send({ questionId: "nope", language: "cpp", code: "x" })).status, 400);
    assert.equal((await api().post("/api/submissions").set(H(student)).send({ questionId: String(q._id), language: "cpp" })).status, 400);
    assert.equal((await api().post("/api/submissions").set(H(student)).send({ questionId: String(q._id), language: "klingon", code: "x" })).status, 400);
});

test("students list only their own submissions, staff can see others", async () => {
    let filter;
    mock.method(Submission, "find", (f) => { filter = f; return query([]); });
    mock.method(Submission, "countDocuments", async () => 0);
    await api().get(`/api/submissions?userId=${other._id}`).set(H(student));
    assert.equal(String(filter.user), String(student._id), "a student must not be able to choose another user");
    await api().get(`/api/submissions?userId=${other._id}`).set(H(teacher));
    assert.equal(String(filter.user), String(other._id));
});

test("a student cannot read another student's submission (404, same as missing)", async () => {
    const doc = { _id: "507f1f77bcf86cd799439012", user: other._id, username: "x", questionId: "507f1f77bcf86cd799439011", code: "secret code", status: "Passed", verdict: "Accepted" };
    mock.method(Submission, "findById", () => query(doc));
    assert.equal((await api().get(`/api/submissions/${doc._id}`).set(H(student))).status, 404);
    const ok = await api().get(`/api/submissions/${doc._id}`).set(H(teacher));
    assert.equal(ok.status, 200);
    assert.equal(ok.body.code, "secret code");
});

test("signup: role escalation attempts are ignored; weak passwords and bad emails rejected", async () => {
    mock.method(User, "findOne", () => query(null));
    const created = mock.method(User, "create", async (d) => new User(d));
    const r = await api().post("/api/auth/signup").send({ username: "eve", email: "Eve@Example.com", password: "Passw0rd1", role: "admin", isAdmin: true });
    assert.equal(r.status, 201);
    assert.equal(created.mock.calls[0].arguments[0].role, "student");
    assert.equal(created.mock.calls[0].arguments[0].email, "eve@example.com");
    assert.equal(r.body.user.role, "student");
    assert.equal((await api().post("/api/auth/signup").send({ username: "e", email: "e@example.com", password: "short" })).status, 400);
    assert.equal((await api().post("/api/auth/signup").send({ username: "ee", email: "not-an-email", password: "Passw0rd1" })).status, 400);
});

test("signup honours ENABLE_SIGNUP=false", async () => {
    const prev = config.enableSignup;
    config.enableSignup = false;
    try {
        assert.equal((await api().post("/api/auth/signup").send({ username: "ee", email: "e@example.com", password: "Passw0rd1" })).status, 403);
        assert.equal((await api().get("/api/auth/config")).body.signupEnabled, false);
    } finally { config.enableSignup = prev; }
});

test("login: same error for unknown email and wrong password; NoSQL operators are neutralised", async () => {
    const real = new User({ username: "u", email: "u@example.com", password: await require("bcrypt").hash("Passw0rd1", 4), role: "student" });
    mock.method(User, "findOne", (f) => query(f.email === "u@example.com" ? real : null));
    const wrong = await api().post("/api/auth/login").send({ email: "u@example.com", password: "nope" });
    const unknown = await api().post("/api/auth/login").send({ email: "ghost@example.com", password: "nope" });
    assert.equal(wrong.status, 401); assert.equal(unknown.status, 401);
    assert.equal(wrong.body.message, unknown.body.message, "must not reveal which emails exist");
    const inj = await api().post("/api/auth/login").send({ email: { $gt: "" }, password: { $gt: "" } });
    assert.equal(inj.status, 400);
    const good = await api().post("/api/auth/login").send({ email: "U@Example.com", password: "Passw0rd1" });
    assert.equal(good.status, 200);
    assert.equal(jwt.decode(good.body.token).id, String(real._id));
    assert.ok(!JSON.stringify(good.body).includes("password"));
});

test("login refuses deactivated accounts", async () => {
    const u = new User({ username: "u", email: "u@example.com", password: await require("bcrypt").hash("Passw0rd1", 4), role: "student", isActive: false });
    mock.method(User, "findOne", () => query(u));
    assert.equal((await api().post("/api/auth/login").send({ email: "u@example.com", password: "Passw0rd1" })).status, 403);
});

test("admin user management: role checks, self-protection, audit trail", async () => {
    assert.equal((await api().get("/api/admin/users").set(H(student))).status, 403);
    assert.equal((await api().get("/api/admin/users").set(H(teacher))).status, 403);
    mock.method(User, "find", () => query([student.toObject()]));
    mock.method(User, "countDocuments", async () => 1);
    const list = await api().get("/api/admin/users?search=stu&role=student").set(H(admin));
    assert.equal(list.status, 200);
    assert.ok(!JSON.stringify(list.body).includes("hashed"), "password hash must not be returned");

    mock.method(User, "findById", async (id) => (String(id) === String(student._id) ? student : String(id) === String(admin._id) ? admin : null));
    loginAs(admin);
    mock.method(student, "save", async () => student);
    const self = await api().patch(`/api/admin/users/${admin._id}/role`).set(H(admin)).send({ role: "student" });
    assert.equal(self.status, 400);
    const bad = await api().patch(`/api/admin/users/${student._id}/role`).set(H(admin)).send({ role: "superuser" });
    assert.equal(bad.status, 400);
    const ok = await api().patch(`/api/admin/users/${student._id}/role`).set(H(admin)).send({ role: "teacher" });
    assert.equal(ok.status, 200);
    assert.equal(auditCalls[0].action, "user.role_changed");
    assert.equal((await api().patch(`/api/admin/users/${student._id}/active`).set(H(admin)).send({ isActive: "no" })).status, 400);
});

test("change-password verifies the current password and password policy, then issues a new token", async () => {
    const real = new User({ username: "u", email: "u@example.com", password: await require("bcrypt").hash("Passw0rd1", 4), role: "student" });
    const h = H(real);
    mock.method(real, "save", async () => real);
    assert.equal((await api().post("/api/auth/change-password").set(h).send({ currentPassword: "wrong", newPassword: "Another1x" })).status, 400);
    assert.equal((await api().post("/api/auth/change-password").set(h).send({ currentPassword: "Passw0rd1", newPassword: "weak" })).status, 400);
    const r = await api().post("/api/auth/change-password").set(h).send({ currentPassword: "Passw0rd1", newPassword: "Another1x" });
    assert.equal(r.status, 200);
    assert.ok(r.body.token);
});

test("malformed JSON, oversize bodies and unknown routes produce clean errors", async () => {
    assert.equal((await api().post("/api/auth/login").set("Content-Type", "application/json").send("{bad")).status, 400);
    assert.equal((await api().get("/nope")).status, 404);
    const big = await api().post("/api/auth/login").send({ email: "a@b.co", password: "x".repeat(600000) });
    assert.equal(big.status, 413);
});

test("health endpoints", async () => {
    assert.equal((await api().get("/health")).body.status, "ok");
    const ready = await api().get("/health/ready");
    assert.equal(ready.status, 503, "not ready without a database connection");
});

test("security headers are set and the server does not advertise Express", async () => {
    const r = await api().get("/health");
    assert.ok(r.headers["x-content-type-options"]);
    assert.ok(!r.headers["x-powered-by"]);
});
