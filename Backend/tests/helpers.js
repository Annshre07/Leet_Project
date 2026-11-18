process.env.JWT_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.MONGO_URI = "mongodb://127.0.0.1:1/unused";
process.env.NODE_ENV = "test";
process.env.JUDGE_MODE = "local";

const { mock } = require("node:test");
const request = require("supertest");
const { getConfig } = require("../config/env");
const { Judge } = require("../services/judge");
const createApp = require("../app");
const User = require("../models/User");
const { signToken } = require("../middleware/authMiddleware");

const config = getConfig();
const judge = new Judge({ ...config.judge, concurrency: 2 });
const app = createApp({ config, judge });
const api = () => request(app);

// Mongoose query stand-in: supports the chain methods the routes use and is awaitable.
const query = (result) => {
    const q = { collation: () => q, lean: () => q, sort: () => q, skip: () => q, limit: () => q, select: () => q, then: (a, b) => Promise.resolve(result).then(a, b), catch: (b) => Promise.resolve(result).catch(b) };
    return q;
};

const makeUser = (role = "student", extra = {}) => new User({ username: `${role}1`, email: `${role}1@example.com`, password: "hashed", role, ...extra });
const tokenFor = (user) => signToken(user);
const auth = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

// authMiddleware calls User.findById; resolve it from an in-memory registry.
const registry = new Map();
const installUserStub = () => mock.method(User, "findById", async (id) => registry.get(String(id)) || null);
installUserStub();
const loginAs = (user) => { registry.set(String(user._id), user); return auth(user); };
const resetUsers = () => registry.clear();

module.exports = { api, app, judge, config, query, makeUser, auth, tokenFor, loginAs, resetUsers, installUserStub, mock };
