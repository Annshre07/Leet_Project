const path = require("path");
const fs = require("fs/promises");
const { LANGUAGES } = require("./languages");
const { localExecutor, dockerExecutor } = require("./executors");
const { outputsMatch } = require("./compare");
const JobQueue = require("./queue");
const HttpError = require("../../utils/httpError");

const MEM_SIGNS = /bad_alloc|MemoryError|OutOfMemoryError|heap out of memory|Cannot allocate memory|std::length_error/i;
const COMPILE_LIMIT_MS = 30000;
const RETURN_CAP = 20000; // characters of stdout/stderr handed back to a client

const cap = (s, n = RETURN_CAP) => (s.length > n ? s.slice(0, n) + "\n…[output truncated]" : s);

function classify(report, stderr, limits, lang) {
    const timeLimit = limits.timeLimitMs * lang.timeMultiplier;
    if (report.startFailed) return "Internal Error";
    if (report.timedOut || report.cpuMs > timeLimit) return "Time Limit Exceeded";
    const overMem = report.maxRssKb > limits.memoryLimitMb * 1024;
    if (report.signal || report.exitCode !== 0) {
        if (overMem || MEM_SIGNS.test(stderr)) return "Memory Limit Exceeded";
        return "Runtime Error";
    }
    if (overMem) return "Memory Limit Exceeded";
    return null; // ran to completion
}

class Judge {
    constructor(cfg) {
        this.cfg = cfg;
        this.executor = cfg.mode === "docker" ? dockerExecutor(cfg.dockerImage) : cfg.mode === "local" ? localExecutor : null;
        this.queue = new JobQueue({ concurrency: cfg.concurrency, maxQueue: cfg.maxQueue });
        this._langCache = null;
    }

    async languages(force = false) {
        if (!this.executor) return [];
        if (!force && this._langCache && Date.now() - this._langCache.at < 60000) return this._langCache.list;
        const has = await this.executor.availableTools();
        const runnerOk = this.cfg.mode === "docker" || has("python3");
        const list = runnerOk
            ? Object.values(LANGUAGES).filter((l) => l.tools.every((t) => has(t))).map((l) => ({ id: l.id, label: l.label, monaco: l.monaco, template: l.template }))
            : [];
        this._langCache = { at: Date.now(), list };
        return list;
    }

    async _requireLanguage(id) {
        const lang = LANGUAGES[id];
        const ok = lang && (await this.languages()).some((l) => l.id === id);
        if (!ok) throw new HttpError(400, `Language "${id}" is not available on this server`);
        return lang;
    }

    // Compile once (if needed) and return a session that can execute test inputs.
    async _open(lang, code, limits) {
        const ws = await this.executor.makeWorkspace();
        try {
            await fs.writeFile(path.join(ws.dir, lang.file), code, "utf8");
            if (lang.compile) {
                const r = await this.executor.exec(ws, { cmd: lang.compile(), timeoutMs: COMPILE_LIMIT_MS, outLimit: 1 << 20 }, "compile");
                if (r.report.startFailed) throw new Error("compiler could not be started: " + r.stderr.slice(0, 200));
                if (r.report.timedOut || r.report.exitCode !== 0) {
                    const text = (r.report.timedOut ? "Compilation timed out\n" : "") + r.stderr + r.stdout;
                    await ws.dispose();
                    return { compileError: cap(text.split(ws.dir).join("."), 4000) };
                }
            }
            return { ws };
        } catch (e) {
            await ws.dispose();
            throw e;
        }
    }

    async _runCase(ws, lang, input, limits, tag) {
        const memMb = limits.memoryLimitMb;
        const spec = {
            cmd: lang.run(memMb),
            stdin: input ?? "",
            timeoutMs: limits.timeLimitMs * lang.timeMultiplier + 500,
            asMb: lang.asLimit ? memMb + 64 : 0,
            nproc: lang.id === "java" ? 0 : 64,
            outLimit: 1 << 20,
            containerMemMb: memMb + (lang.asLimit ? 64 : 384),
        };
        const r = await this.executor.exec(ws, spec, tag);
        const failure = classify(r.report, r.stderr, limits, lang);
        return {
            failure,
            exitCode: r.report.exitCode,
            signal: r.report.signal,
            stdout: r.stdout,
            stderr: r.stderr,
            outputTruncated: r.truncated,
            timeMs: Math.round(r.report.cpuMs),
            memoryKb: r.report.maxRssKb,
        };
    }

    // Run once with custom input (the "Run" button).
    async run({ language, code, input = "", timeLimitMs = 2000, memoryLimitMb = 256 }) {
        const lang = await this._requireLanguage(language);
        const limits = { timeLimitMs, memoryLimitMb };
        return this.queue.run(async () => {
            const s = await this._open(lang, code, limits);
            if (s.compileError !== undefined) return { verdict: "Compilation Error", compileOutput: s.compileError, stdout: "", stderr: "", timeMs: 0, memoryKb: 0 };
            try {
                const r = await this._runCase(s.ws, lang, input, limits, "run");
                return {
                    verdict: r.failure || "Completed",
                    stdout: cap(r.stdout), stderr: cap(r.stderr),
                    timeMs: r.timeMs, memoryKb: r.memoryKb, exitCode: r.exitCode,
                    outputTruncated: r.outputTruncated || undefined,
                };
            } finally {
                await s.ws.dispose();
            }
        });
    }

    // Grade against every test case (the "Submit" button). Returns full detail; callers decide what to expose.
    async grade({ language, code, tests, timeLimitMs = 2000, memoryLimitMb = 256, compareMode = "trimmed" }) {
        const lang = await this._requireLanguage(language);
        const limits = { timeLimitMs, memoryLimitMb };
        return this.queue.run(async () => {
            const s = await this._open(lang, code, limits);
            if (s.compileError !== undefined) return { compileError: s.compileError, results: [] };
            try {
                const results = [];
                for (let i = 0; i < tests.length; i++) {
                    const t = tests[i];
                    const r = await this._runCase(s.ws, lang, t.input, limits, `t${i}`);
                    let verdict = r.failure;
                    if (!verdict) verdict = outputsMatch(r.stdout, t.expectedOutput, compareMode) && !r.outputTruncated ? "Accepted" : "Wrong Answer";
                    results.push({ index: i, hidden: !!t.hidden, weight: t.weight ?? 1, verdict, timeMs: r.timeMs, memoryKb: r.memoryKb, stdout: r.stdout, stderr: r.stderr });
                }
                return { results };
            } finally {
                await s.ws.dispose();
            }
        });
    }

    health() {
        return { mode: this.cfg.mode, queue: this.queue.stats() };
    }
}

module.exports = { Judge, classify };
