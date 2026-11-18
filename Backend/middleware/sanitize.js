// Strips keys that Mongo interprets as operators ("$gt") or paths ("a.b") to block NoSQL injection.
const clean = (value, depth = 0) => {
    if (depth > 10 || value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((v) => clean(v, depth + 1));
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        if (k.startsWith("$") || k.includes(".")) continue;
        out[k] = clean(v, depth + 1);
    }
    return out;
};

module.exports = (req, res, next) => {
    if (req.body) req.body = clean(req.body);
    if (req.params) req.params = clean(req.params);
    if (req.query) {
        // req.query is a getter in newer Express versions; mutate in place
        const q = clean(req.query);
        for (const k of Object.keys(req.query)) delete req.query[k];
        Object.assign(req.query, q);
    }
    next();
};
module.exports.clean = clean;
