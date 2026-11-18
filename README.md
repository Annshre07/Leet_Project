# Labyrinth

Coding practice and assessment platform: React frontend, Node/Express + MongoDB API, and a sandboxed code judge.
Status and roadmap: see `DEVELOPMENT_PROGRESS.md` and `PROJECT_AUDIT.md`.

## What works today
- Sign-in with JWT; roles `student`, `teacher`, `admin` enforced **on the server** (the browser's role is only used to pick screens).
- Admin: list/search users, change roles, activate/deactivate accounts (audit-logged).
- Admin/teacher: create, edit problems with sample **and hidden** test cases, weights, time/memory limits, deadline (valid to the end of the IST day).
- Students: Run code with custom input, Submit for server-side grading, per-case verdicts, score, runtime and memory, submission history.
- Languages: C, C++, Python, Java, JavaScript. A language is only offered if its toolchain exists on the server.

Not built yet: bulk student import and forced first-login password change, assessments, contests, leaderboards, notifications, discussions, editorials, Redis/BullMQ queue, load tests. See the progress file.

## Requirements
Node 20+, MongoDB, and for the judge either `g++`, `gcc`, `python3`, `java`/`javac`, `node` (JUDGE_MODE=local, development only) or Docker (JUDGE_MODE=docker).

## Setup
```bash
# API
cd Backend
cp .env.example .env          # fill MONGO_URI and a long random JWT_SECRET
npm ci
node scripts/migrate-legacy.js --dry-run   # only if you have Labyrinth 1.x data; then run without --dry-run
node scripts/createAdmin.js --email you@example.com   # prints a one-time password if ADMIN_PASSWORD is unset
npm start                      # http://localhost:5000, GET /health, GET /health/ready

# Web app
cd ../Frontend
cp .env.example .env           # REACT_APP_API_URL
npm ci
npm start                      # http://localhost:3000
```

## Environment (Backend/.env)
| Variable | Meaning |
|---|---|
| `MONGO_URI`, `JWT_SECRET` (>= 32 chars) | required; the server refuses to start without them |
| `CORS_ORIGINS` | comma-separated allowed origins |
| `ENABLE_SIGNUP` | `false` disables public registration |
| `JUDGE_MODE` | `local` (dev only, NOT a security boundary), `docker`, or `disabled`. Production refuses `local` unless `ALLOW_UNSAFE_LOCAL_JUDGE=true` |
| `JUDGE_CONCURRENCY`, `JUDGE_MAX_QUEUE` | parallel runs and queue length (503 when full) |
| `JUDGE_IMAGE` | Docker image for `docker` mode |

## Docker judge
```bash
docker build -t labyrinth-judge:latest -f Backend/judge/Dockerfile Backend/services/judge
```
Each run is a throwaway container: no network, read-only root, dropped capabilities, memory/pids limits, non-root user.
This path is implemented but has **not** been exercised in CI here (no Docker daemon); test it on your host before relying on it.

## Tests
```bash
cd Backend && npm test        # unit + real code-execution + API tests (MongoDB models are stubbed)
cd Frontend && CI=true npm test
```
No test here talks to a real MongoDB; run a manual smoke test against your database before deploying.

## Security notes
- `Backend/.env` was previously committed to git. **Rotate the MongoDB password and JWT secret**; removing the file does not remove it from history.
- Do not expose the API with `JUDGE_MODE=local`.
