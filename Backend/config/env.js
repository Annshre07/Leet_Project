require("dotenv").config();

const bool = (v, d) => (v === undefined || v === "" ? d : ["1", "true", "yes", "on"].includes(String(v).toLowerCase()));
const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);

function loadConfig(env = process.env) {
    const nodeEnv = env.NODE_ENV || "development";
    const isProd = nodeEnv === "production";
    const errors = [];

    if (!env.MONGO_URI) errors.push("MONGO_URI is required");
    if (!env.JWT_SECRET) errors.push("JWT_SECRET is required");
    else if (env.JWT_SECRET.length < 32) errors.push("JWT_SECRET must be at least 32 characters");
    else if (/^mysecretkey$/i.test(env.JWT_SECRET)) errors.push("JWT_SECRET must not be the legacy default");

    const judgeMode = env.JUDGE_MODE || (isProd ? "docker" : "local");
    if (!["local", "docker", "disabled"].includes(judgeMode)) errors.push("JUDGE_MODE must be local, docker or disabled");
    const allowUnsafeLocal = bool(env.ALLOW_UNSAFE_LOCAL_JUDGE, false);
    if (judgeMode === "local" && isProd && !allowUnsafeLocal) {
        errors.push("JUDGE_MODE=local is refused in production (set JUDGE_MODE=docker, or ALLOW_UNSAFE_LOCAL_JUDGE=true to override at your own risk)");
    }

    if (errors.length) {
        const err = new Error("Invalid configuration:\n - " + errors.join("\n - "));
        err.code = "CONFIG_INVALID";
        throw err;
    }

    return {
        nodeEnv,
        isProd,
        port: int(env.PORT, 5000),
        mongoUri: env.MONGO_URI,
        jwtSecret: env.JWT_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN || "1h",
        corsOrigins: (env.CORS_ORIGINS || "http://localhost:3000").split(",").map((s) => s.trim()).filter(Boolean),
        enableSignup: bool(env.ENABLE_SIGNUP, true),
        judge: {
            mode: judgeMode,
            concurrency: Math.max(1, int(env.JUDGE_CONCURRENCY, 2)),
            maxQueue: Math.max(1, int(env.JUDGE_MAX_QUEUE, 50)),
            dockerImage: env.JUDGE_IMAGE || "labyrinth-judge:latest",
        },
    };
}

let cached;
const getConfig = () => (cached = cached || loadConfig());
const resetConfig = () => { cached = undefined; };

module.exports = { loadConfig, getConfig, resetConfig };
