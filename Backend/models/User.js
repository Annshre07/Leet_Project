const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const ROLES = ["student", "teacher", "admin"];
// "user" is the legacy role value from Labyrinth 1.x; it is treated as "student".
const LEGACY_ROLE = "user";

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, trim: true, maxlength: 60 },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true },
        role: { type: String, enum: [...ROLES, LEGACY_ROLE], default: "student" },
        isActive: { type: Boolean, default: true },
        passwordChangedAt: { type: Date },
    },
    { timestamps: true }
);

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = new Date();
    next();
});

UserSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

UserSchema.virtual("effectiveRole").get(function () {
    return this.role === LEGACY_ROLE ? "student" : this.role;
});

UserSchema.methods.toSafeJSON = function () {
    return {
        id: this._id,
        username: this.username,
        email: this.email,
        role: this.effectiveRole,
        isActive: this.isActive,
    };
};

const User = mongoose.model("User", UserSchema);
User.ROLES = ROLES;
module.exports = User;
