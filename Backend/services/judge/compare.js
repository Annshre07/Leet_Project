// Output comparison rules (the old client-side check lowercased and stripped ALL whitespace and ';').
const normLines = (s) =>
    String(s ?? "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((l) => l.replace(/[ \t]+$/g, ""))
        .join("\n")
        .replace(/\n+$/g, "");

const normTokens = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean).join(" ");

function outputsMatch(actual, expected, mode = "trimmed") {
    return mode === "tokens" ? normTokens(actual) === normTokens(expected) : normLines(actual) === normLines(expected);
}

module.exports = { outputsMatch, normLines, normTokens };
