const express = require("express");
const User = require("../models/User");
const { requireRole } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const audit = require("../services/audit");
const { parsePaging, requireObjectId, isStr } = require("../utils/validators");

const router = express.Router();
router.use(requireRole("admin"));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const publicUser = (u) => ({ _id: u._id, username: u.username, email: u.email, role: u.role === "user" ? "student" : u.role, isActive: u.isActive !== false, createdAt: u.createdAt });

router.get("/users", asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePaging(req.query);
    const filter = {};
    if (isStr(req.query.role) && User.ROLES.includes(req.query.role)) {
        filter.role = req.query.role === "student" ? { $in: ["student", "user"] } : req.query.role;
    }
    if (isStr(req.query.search) && req.query.search.trim()) {
        const rx = new RegExp(escapeRegex(req.query.search.trim().slice(0, 60)), "i");
        filter.$or = [{ username: rx }, { email: rx }];
    }
    const [items, total] = await Promise.all([
        User.find(filter, "-password").sort({ createdAt: -1, _id: 1 }).skip(skip).limit(limit).lean(),
        User.countDocuments(filter),
    ]);
    res.json({ items: items.map(publicUser), total, page, limit });
}));

async function setRole(req, res, role) {
    requireObjectId(req.params.id || req.body.userId, "user id");
    const user = await User.findById(req.params.id || req.body.userId);
    if (!user) throw new HttpError(404, "User not found");
    if (!User.ROLES.includes(role)) throw new HttpError(400, `Role must be one of ${User.ROLES.join(", ")}`);
    if (String(user._id) === String(req.user._id) && role !== "admin") throw new HttpError(400, "You cannot remove your own admin role");
    const previous = user.effectiveRole;
    if (previous === role) return res.json({ message: "No change", user: publicUser(user) });
    user.role = role;
    await user.save();
    await audit(req.user, "user.role_changed", user._id, { from: previous, to: role });
    res.json({ message: `Role updated to ${role}`, user: publicUser(user) });
}

router.patch("/users/:id/role", asyncHandler((req, res) => setRole(req, res, req.body.role)));
// Legacy endpoint used by the 1.x admin screen.
router.post("/auth/promote", asyncHandler((req, res) => setRole(req, res, "admin")));

router.patch("/users/:id/active", asyncHandler(async (req, res) => {
    requireObjectId(req.params.id, "user id");
    if (typeof req.body.isActive !== "boolean") throw new HttpError(400, "isActive must be true or false");
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, "User not found");
    if (String(user._id) === String(req.user._id) && !req.body.isActive) throw new HttpError(400, "You cannot deactivate your own account");
    user.isActive = req.body.isActive;
    await user.save();
    await audit(req.user, req.body.isActive ? "user.activated" : "user.deactivated", user._id);
    res.json({ message: "Updated", user: publicUser(user) });
}));

router.get("/judge/status", (req, res) => res.json(req.app.locals.judge.health()));

module.exports = router;
