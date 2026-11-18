const AuditLog = require("../models/AuditLog");

// Audit failures must never break the user-facing action.
module.exports = async function audit(actor, action, target, meta) {
    try {
        await AuditLog.create({ actor: actor._id || actor, action, target: target && String(target), meta });
    } catch (err) {
        console.error(JSON.stringify({ level: "warn", msg: "audit write failed", action, error: err.message }));
    }
};
