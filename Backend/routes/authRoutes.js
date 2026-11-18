const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { authMiddleware, signToken } = require("../middleware/authMiddleware");
const { loginLimiter, signupLimiter } = require("../middleware/rateLimit");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { getConfig } = require("../config/env");
const { EMAIL_RE, normaliseEmail, passwordProblem, requireString, isStr } = require("../utils/validators");

const router = express.Router();
const CI = { locale: "en", strength: 2 }; // case-insensitive lookups also match legacy mixed-case emails
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

const session = (user) => ({ token: signToken(user), user: user.toSafeJSON() });

router.get("/config", (req, res) => res.json({ signupEnabled: getConfig().enableSignup }));

router.post("/signup", signupLimiter, asyncHandler(async (req, res) => {
    if (!getConfig().enableSignup) throw new HttpError(403, "Self-registration is disabled. Ask an administrator for an account.");
    const username = requireString(req.body.username, "Username", { min: 2, max: 60 }).trim();
    const email = normaliseEmail(req.body.email);
    if (!EMAIL_RE.test(email)) throw new HttpError(400, "A valid email is required");
    const pwProblem = passwordProblem(req.body.password);
    if (pwProblem) throw new HttpError(400, pwProblem);

    if (await User.findOne({ email }).collation(CI)) throw new HttpError(409, "Email already exists");

    // Role is never taken from the request; admins are created with scripts/createAdmin.js or by another admin.
    const user = await User.create({ username, email, password: req.body.password, role: "student" });
    res.status(201).json({ message: "Signup successful", ...session(user) });
}));

router.post("/login", loginLimiter, asyncHandler(async (req, res) => {
    const email = normaliseEmail(req.body.email);
    const password = req.body.password;
    if (!email || !isStr(password)) throw new HttpError(400, "Email and password are required");

    const user = await User.findOne({ email }).collation(CI);
    const ok = user ? await user.comparePassword(password) : (await bcrypt.compare(password, DUMMY_HASH), false);
    if (!user || !ok) throw new HttpError(401, "Invalid email or password");
    if (user.isActive === false) throw new HttpError(403, "This account has been deactivated");

    res.json({ message: "Login successful", ...session(user) });
}));

router.get("/me", authMiddleware, (req, res) => res.json({ user: req.user.toSafeJSON() }));

router.post("/change-password", authMiddleware, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!isStr(currentPassword) || !(await req.user.comparePassword(currentPassword))) throw new HttpError(400, "Current password is incorrect");
    const problem = passwordProblem(newPassword);
    if (problem) throw new HttpError(400, problem);
    if (newPassword === currentPassword) throw new HttpError(400, "New password must differ from the current one");
    req.user.password = newPassword;
    await req.user.save();
    res.json({ message: "Password changed", ...session(req.user) });
}));

module.exports = router;
