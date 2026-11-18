#!/usr/bin/env node
// One-time, idempotent migration from Labyrinth 1.x data. Safe to re-run. Use --dry-run to preview.
//  - users: role "user" -> "student"; sets isActive=true where missing
//  - submissions: language defaults to "cpp"; legacy rows stay serverVerified=false (graded in the browser, untrusted)
const mongoose = require("mongoose");
const { getConfig } = require("../config/env");

(async () => {
    const dry = process.argv.includes("--dry-run");
    await mongoose.connect(getConfig().mongoUri);
    const db = mongoose.connection.db;
    const plan = [
        ["users: role user -> student", db.collection("users"), { role: "user" }, { $set: { role: "student" } }],
        ["users: isActive default", db.collection("users"), { isActive: { $exists: false } }, { $set: { isActive: true } }],
        ["submissions: language default", db.collection("submissions"), { language: { $exists: false } }, { $set: { language: "cpp" } }],
        ["submissions: serverVerified=false", db.collection("submissions"), { serverVerified: { $exists: false } }, { $set: { serverVerified: false } }],
    ];
    for (const [label, col, filter, update] of plan) {
        const n = await col.countDocuments(filter);
        if (!dry && n) await col.updateMany(filter, update);
        console.log(`${dry ? "[dry-run] would update" : "updated"} ${n}  ${label}`);
    }
    const dupes = await db.collection("users").aggregate([{ $group: { _id: { $toLower: "$email" }, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]).toArray();
    if (dupes.length) console.warn("WARNING: emails that differ only by case (resolve manually):", dupes.map((d) => d._id).join(", "));
    await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
