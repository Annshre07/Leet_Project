const rateLimit = require("express-rate-limit");

const make = (windowMs, limit, message) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        message: { message },
    });

const keyByUser = (req) => (req.user ? `u:${req.user.id}` : req.ip);

module.exports = {
    loginLimiter: make(15 * 60 * 1000, 20, "Too many attempts, try again later"),
    signupLimiter: make(60 * 60 * 1000, 20, "Too many sign-ups from this address"),
    runLimiter: rateLimit({
        windowMs: 60 * 1000,
        limit: 20,
        keyGenerator: keyByUser,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        message: { message: "Too many runs, slow down" },
        validate: { keyGeneratorIpFallback: false },
    }),
    submitLimiter: rateLimit({
        windowMs: 60 * 1000,
        limit: 10,
        keyGenerator: keyByUser,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        message: { message: "Too many submissions, slow down" },
        validate: { keyGeneratorIpFallback: false },
    }),
};
