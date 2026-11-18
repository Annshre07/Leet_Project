const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
    {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        action: { type: String, required: true },
        target: { type: String },
        meta: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
