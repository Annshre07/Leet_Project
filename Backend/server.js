const mongoose = require("mongoose");
const { getConfig } = require("./config/env");
const connectDB = require("./config/db");
const createApp = require("./app");
const { Judge } = require("./services/judge");

async function main() {
    const config = getConfig(); // throws with a clear message if the environment is unsafe or incomplete
    await connectDB(config.mongoUri);

    const judge = new Judge(config.judge);
    const langs = await judge.languages();
    console.log(`Judge mode: ${config.judge.mode}; languages: ${langs.map((l) => l.id).join(", ") || "none"}`);
    if (config.judge.mode === "local") console.warn("WARNING: JUDGE_MODE=local executes submitted code on this machine. Development only.");

    const app = createApp({ config, judge });
    const server = app.listen(config.port, () => console.log(`API listening on port ${config.port}`));

    const shutdown = (signal) => {
        console.log(`${signal} received, shutting down`);
        server.close(async () => {
            await mongoose.connection.close().catch(() => {});
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 15000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
    console.error(err.code === "CONFIG_INVALID" ? err.message : err);
    process.exit(1);
});
