const { spawn, spawnSync } = require("child_process");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const RUNNER = path.join(__dirname, "runner.py");
const MAX_CAPTURE = 256 * 1024; // bytes of stdout/stderr we ever read back

const readCapped = async (file) => {
    try {
        const fh = await fs.open(file, "r");
        try {
            const { size } = await fh.stat();
            const buf = Buffer.alloc(Math.min(size, MAX_CAPTURE));
            await fh.read(buf, 0, buf.length, 0);
            return { text: buf.toString("utf8"), truncated: size > MAX_CAPTURE };
        } finally {
            await fh.close();
        }
    } catch {
        return { text: "", truncated: false };
    }
};

const runnerArgs = (workdir, spec, tag) => {
    const a = ["--workdir", workdir, "--timeout-ms", String(Math.ceil(spec.timeoutMs)),
        "--as-mb", String(spec.asMb || 0), "--out-limit", String(spec.outLimit || 1 << 20),
        "--stdout", `${tag}.out`, "--stderr", `${tag}.err`];
    if (spec.nproc) a.push("--nproc", String(spec.nproc));
    if (spec.stdin !== undefined) a.push("--stdin", `${tag}.in`);
    return [...a, "--", ...spec.cmd];
};

const collect = (child, hardTimeoutMs, onTimeout) =>
    new Promise((resolve) => {
        let out = "", err = "", done = false;
        const finish = (r) => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
        const timer = setTimeout(() => { onTimeout(); finish({ hardTimeout: true }); }, hardTimeoutMs);
        child.stdout.on("data", (d) => { if (out.length < 8192) out += d; });
        child.stderr.on("data", (d) => { if (err.length < 8192) err += d; });
        child.on("error", (e) => finish({ spawnError: e.message }));
        child.on("close", () => finish({ out, err }));
    });

async function finishExec(dir, tag, res) {
    if (res.spawnError || res.hardTimeout) {
        return { report: { startFailed: !!res.spawnError, timedOut: !!res.hardTimeout, exitCode: null, signal: null, cpuMs: 0, wallMs: 0, maxRssKb: 0 }, stdout: "", stderr: res.spawnError || "", truncated: false };
    }
    let report;
    try { report = JSON.parse(res.out.trim().split("\n").pop()); }
    catch { return { report: { startFailed: true, exitCode: null, signal: null, cpuMs: 0, wallMs: 0, maxRssKb: 0 }, stdout: "", stderr: "judge runner failed: " + res.err.slice(0, 500), truncated: false }; }
    const [o, e] = await Promise.all([readCapped(path.join(dir, `${tag}.out`)), readCapped(path.join(dir, `${tag}.err`))]);
    return { report, stdout: o.text, stderr: e.text, truncated: o.truncated };
}

async function makeWorkspace() {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lab-judge-"));
    await fs.chmod(dir, 0o777); // the container user (nobody) must be able to write here
    return { dir, dispose: () => fs.rm(dir, { recursive: true, force: true }).catch(() => {}) };
}

// ---- Local executor: runs on the host. Development only: NOT a security boundary. ----
const localExecutor = {
    mode: "local",
    async availableTools() {
        const ok = (cmd) => !spawnSync(cmd, ["--version"], { stdio: "ignore", timeout: 5000 }).error;
        const cache = {};
        return (tool) => (cache[tool] ??= ok(tool));
    },
    makeWorkspace,
    async exec(ws, spec, tag) {
        if (spec.stdin !== undefined) await fs.writeFile(path.join(ws.dir, `${tag}.in`), spec.stdin);
        const child = spawn("python3", [RUNNER, ...runnerArgs(ws.dir, spec, tag)], { stdio: ["ignore", "pipe", "pipe"], detached: true });
        const res = await collect(child, spec.timeoutMs + 5000, () => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* gone */ } });
        return finishExec(ws.dir, tag, res);
    },
};

// ---- Docker executor: each execution in a throwaway container with no network. ----
// Needs the image from Backend/judge/Dockerfile. Not exercised by the automated tests (no Docker daemon in CI sandbox).
const dockerExecutor = (image) => ({
    mode: "docker",
    async availableTools() {
        const r = spawnSync("docker", ["image", "inspect", image], { stdio: "ignore", timeout: 10000 });
        const ok = !r.error && r.status === 0;
        return () => ok;
    },
    makeWorkspace,
    async exec(ws, spec, tag) {
        if (spec.stdin !== undefined) await fs.writeFile(path.join(ws.dir, `${tag}.in`), spec.stdin);
        const name = `lab-${crypto.randomBytes(6).toString("hex")}`;
        const memMb = (spec.containerMemMb || 512);
        const args = ["run", "--rm", "--name", name, "--network", "none",
            "--memory", `${memMb}m`, "--memory-swap", `${memMb}m`, "--cpus", "1", "--pids-limit", String(spec.nproc || 128),
            "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--read-only", "--tmpfs", "/tmp:rw,size=64m",
            "-u", "65534:65534", "-v", `${ws.dir}:/work`, "-w", "/work", image,
            "python3", "/judge/runner.py", ...runnerArgs("/work", spec, tag)];
        const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
        const res = await collect(child, spec.timeoutMs + 8000, () => { spawn("docker", ["kill", name], { stdio: "ignore" }); });
        return finishExec(ws.dir, tag, res);
    },
});

module.exports = { localExecutor, dockerExecutor };
