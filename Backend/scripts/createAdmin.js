#!/usr/bin/env node
// Usage: node scripts/createAdmin.js --email you@example.com [--username "Name"]
// Password comes from ADMIN_PASSWORD, or a random one is generated and printed once.
// If the user already exists they are promoted to admin and their password is left alone.
const crypto = require("crypto");
const mongoose = require("mongoose");
const { getConfig } = require("../config/env");
const User = require("../models/User");
const { passwordProblem, EMAIL_RE } = require("../utils/validators");

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : undefined; };

(async () => {
    const email = (arg("email") || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) { console.error("Usage: node scripts/createAdmin.js --email you@example.com [--username Name]"); process.exit(2); }
    const cfg = getConfig();
    await mongoose.connect(cfg.mongoUri);
    let user = await User.findOne({ email }).collation({ locale: "en", strength: 2 });
    if (user) {
        user.role = "admin";
        user.isActive = true;
        await user.save();
        console.log(`Existing user ${email} promoted to admin (password unchanged).`);
    } else {
        let password = process.env.ADMIN_PASSWORD;
        const generated = !password;
        if (generated) password = crypto.randomBytes(9).toString("base64url") + "a1";
        const problem = passwordProblem(password);
        if (problem) { console.error(problem); process.exit(2); }
        user = await User.create({ username: arg("username") || email.split("@")[0], email, password, role: "admin" });
        console.log(`Admin created: ${email}`);
        if (generated) console.log(`Temporary password (shown once): ${password}`);
    }
    await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
