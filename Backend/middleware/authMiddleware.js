const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getConfig } = require("../config/env");

const bearer = (req) => {
    const h = req.headers.authorization || "";
    const [scheme, token] = h.split(" ");
    return scheme === "Bearer" && token ? token : null;
};

const signToken = (user) =>
    jwt.sign({ id: String(user._id), role: user.effectiveRole }, getConfig().jwtSecret, {
        algorithm: "HS256",
        expiresIn: getConfig().jwtExpiresIn,
    });

// Authenticates the request. The role is always read from the database, never from the token or client.
const authMiddleware = async (req, res, next) => {
    try {
        const token = bearer(req);
        if (!token) return res.status(401).json({ message: "Authentication required" });

        let decoded;
        try {
            decoded = jwt.verify(token, getConfig().jwtSecret, { algorithms: ["HS256"] });
        } catch {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const user = await User.findById(decoded.id);
        if (!user || user.isActive === false) return res.status(401).json({ message: "Account not available" });
        if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
            return res.status(401).json({ message: "Session expired, please log in again" });
        }

        req.user = user;
        req.role = user.effectiveRole;
        next();
    } catch (err) {
        next(err);
    }
};

const requireRole = (...roles) => [
    authMiddleware,
    (req, res, next) => (roles.includes(req.role) ? next() : res.status(403).json({ message: "Forbidden" })),
];

const authenticateAdmin = requireRole("admin");

module.exports = { authMiddleware, authenticate: authMiddleware, authenticateAdmin, requireRole, signToken };
