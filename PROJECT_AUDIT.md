# PROJECT_AUDIT.md — Labyrinth

Original audit (static read) re-checked against the real repository, then Phase 2 plus the core of Phase 4 implemented.
"Fixed" means: changed in code **and** covered by an automated test that passes (MongoDB models stubbed; no real database or browser E2E was available).

## Additional finding from the real repo
| # | Finding | Status |
|---|---|---|
| N1 | `Backend/.env` (Mongo credentials, JWT secret) was committed to git | File removed from the index and ignored. **Still in git history: rotate the MongoDB password and JWT secret.** |

## Security
| # | Finding | Status |
|---|---|---|
| S1 | Unauthenticated remote code execution on the API host | Fixed: endpoints require login, per-user rate limits, bounded queue, wall/CPU/memory/output/process limits, temp dirs cleaned, no server env visible to programs. `local` mode is still not a sandbox and is refused in production; `docker` mode implemented but **untested** here |
| S2 | Admin = client-sent `admin: true` header | Fixed: role read from DB per request (`requireRole`) |
| S3 | Grading in the browser, forgeable submissions | Fixed: server grades every submission; client verdict/score/user fields ignored |
| S4 | Expected outputs sent to everyone | Fixed: hidden cases never leave the server for students. **Existing problems have all cases visible until a teacher marks some as hidden** |
| S5 | Admin by hard-coded email | Fixed: removed; use `scripts/createAdmin.js` |
| S6 | JWT secret fallback `mysecretkey` | Fixed: server refuses to start without a 32+ char secret |
| S7 | Frontend-only role gating | Server enforces; UI guard is UX only |

## Functional
| # | Finding | Status |
|---|---|---|
| F1 | Test input never reached the program | Fixed (real stdin) |
| F2 | Submission save failed (string execution time) | Fixed (numeric ms) |
| F3 | Fake language selector | Fixed: only installed languages listed (C, C++, Python, Java, JavaScript tested) |
| F4 | No Run vs Submit, no custom input | Fixed |
| F5 | Meaningless metrics, no timeout | Fixed: CPU time and peak RSS via `wait4`, hard timeouts. Environment-dependent; UI says so |
| F6 | Over-lenient output comparison | Fixed: trimmed-lines (default) or token mode |
| F7 | Compile errors invisible / spawn crash | Fixed |
| F8 | AdminProfile infinite fetch loop | Fixed (paginated, server-side search) |
| F9 | Add Question crash | Fixed (form rewritten; edit added) |
| F10 | Deadline/visibility bugs | Fixed: valid to end of IST day, enforced on submit |
| F11 | Dead/broken routes | Removed |
| F12 | GridFS/temp file leakage | Removed GridFS; temp dirs deleted |
| F13 | Submission schema gaps, orphans | Fixed; deleting a question with submissions needs explicit confirmation |
| F14 | Broken frontend deps/tests | Fixed: icons-material declared, unused deps removed, 9 tests pass, production build compiles |

## Still open (spec items not built)
Bulk student import, per-user temporary passwords and forced first-login change, password reset, batches/departments, assessments, contests, leaderboards, achievements, notifications, discussions, editorials/solutions, admin analytics, Redis/BullMQ queue and multi-instance scaling, Socket.IO, k6 load tests, CSRF review (token auth in localStorage is XSS-sensitive), dependency audit, deployment guide.
Legacy submissions (graded in the browser) are flagged `serverVerified: false` and visible only to staff.
The removed placeholder pages (Discuss, Editorial, Solution, Home) will return when implemented.

## Decisions still needed
Sandbox choice (Docker runner vs Judge0), deployment target (Docker/Redis availability), disable public signup, email provider for resets, whether real student data exists (back up before running `migrate-legacy.js`).
