// Turns raw per-test results into a verdict and score. All scoring happens here, on the server.

function summarise({ compileError, results }) {
    if (compileError !== undefined) {
        return { verdict: "Compilation Error", score: 0, passedCount: 0, totalCount: 0, compileOutput: compileError, executionTime: 0, memoryUsed: 0, results: [] };
    }
    const total = results.reduce((a, r) => a + (r.weight ?? 1), 0);
    const passedW = results.filter((r) => r.verdict === "Accepted").reduce((a, r) => a + (r.weight ?? 1), 0);
    const passedCount = results.filter((r) => r.verdict === "Accepted").length;
    const firstFail = results.find((r) => r.verdict !== "Accepted");
    const verdict = results.length === 0 ? "Internal Error" : firstFail ? firstFail.verdict : "Accepted";
    const score = total > 0 ? Math.round((passedW / total) * 10000) / 100 : results.length && !firstFail ? 100 : 0;
    return {
        verdict,
        score,
        passedCount,
        totalCount: results.length,
        executionTime: Math.max(0, ...results.map((r) => r.timeMs || 0)),
        memoryUsed: Math.max(0, ...results.map((r) => r.memoryKb || 0)),
        results: results.map(({ index, hidden, verdict: v, timeMs, memoryKb, weight }) => ({ index, hidden, verdict: v, timeMs, memoryKb, weight })),
    };
}

// What a student may see about a graded run: hidden cases are reported as pass/fail only.
function studentView(summary, results) {
    return {
        verdict: summary.verdict,
        score: summary.score,
        passedCount: summary.passedCount,
        totalCount: summary.totalCount,
        compileOutput: summary.compileOutput,
        executionTime: summary.executionTime,
        memoryUsed: summary.memoryUsed,
        results: summary.results.map((r) => ({ index: r.index, hidden: r.hidden, verdict: r.verdict, timeMs: r.timeMs, memoryKb: r.memoryKb })),
    };
}

module.exports = { summarise, studentView };
