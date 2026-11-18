const HttpError = require("./httpError");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isStr = (v) => typeof v === "string";

const normaliseEmail = (v) => (isStr(v) ? v.trim().toLowerCase() : "");

function passwordProblem(pw) {
    if (!isStr(pw)) return "Password is required";
    if (pw.length < 8) return "Password must be at least 8 characters";
    if (pw.length > 128) return "Password is too long";
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password must contain at least one letter and one number";
    return null;
}

const requireString = (v, name, { min = 1, max = 10000 } = {}) => {
    if (!isStr(v) || v.trim().length < min) throw new HttpError(400, `${name} is required`);
    if (v.length > max) throw new HttpError(400, `${name} is too long`);
    return v;
};

const objectIdRe = /^[0-9a-fA-F]{24}$/;
const requireObjectId = (v, name = "id") => {
    if (!isStr(v) || !objectIdRe.test(v)) throw new HttpError(400, `Invalid ${name}`);
    return v;
};

const parsePaging = (q, { defaultLimit = 20, maxLimit = 100 } = {}) => {
    const page = Math.max(1, parseInt(q.page, 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(q.limit, 10) || defaultLimit));
    return { page, limit, skip: (page - 1) * limit };
};

module.exports = { EMAIL_RE, normaliseEmail, passwordProblem, requireString, requireObjectId, parsePaging, isStr, objectIdRe };
