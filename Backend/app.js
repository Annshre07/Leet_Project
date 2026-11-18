const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const sanitize = require("./middleware/sanitize");
const { notFound, errorHandler } = require("./middleware/errorHandler");

function createApp({ config, judge }) {
    const app = express();
    app.disable("x-powered-by");
    app.set("trust proxy", config.isProd ? 1 : false);
    app.locals.judge = judge;
    app.locals.config = config;

    app.use(helmet());
    app.use(
        cors({
            origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"],
        })
    );
    app.use(express.json({ limit: "512kb" }));
    app.use(sanitize);

    app.get("/", (req, res) => res.json({ name: "Labyrinth API", status: "ok" }));
    app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
    app.get("/health/ready", (req, res) => {
        const db = mongoose.connection.readyState === 1;
        res.status(db ? 200 : 503).json({ status: db ? "ready" : "degraded", db, judge: judge.health() });
    });

    app.use("/api/auth", require("./routes/authRoutes"));
    app.use("/api/admin", require("./routes/adminRoutes"));
    app.use("/api/questions", require("./routes/questionRoutes"));
    app.use("/api/submissions", require("./routes/submissionRoutes"));
    app.use("/api/judge", require("./routes/judgeRoutes"));

    app.use(notFound);
    app.use(errorHandler);
    return app;
}

module.exports = createApp;
