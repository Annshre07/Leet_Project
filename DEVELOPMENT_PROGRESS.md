# DEVELOPMENT_PROGRESS.md
Legend: Not Started · In Progress · Implemented · Tested · Verified · Blocked.
"Tested" = automated tests pass here. "Verified" needs frontend + backend + a real database + permissions together; nothing is Verified yet because no MongoDB or browser was available.

_Updated 2026-11-18. Backend: 53 tests pass. Frontend: 9 tests pass, production build compiles._

| Phase | Item | Status | Notes |
|---|---|---|---|
| 1 | Audit | Tested | PROJECT_AUDIT.md |
| 2 | Dead code removal, deps, env validation | Tested | |
| 2 | JWT RBAC (student/teacher/admin) | Tested | |
| 2 | helmet, CORS from env, rate limits, error handler, /health | Tested | |
| 2 | Frontend API client, token handling, route guards | Tested | |
| 2 | Admin user management (search, role, activate, audit log) | Tested | UI not exercised in a browser |
| 3 | Admin-created accounts, bulk import, forced password change, reset | Not Started | Self-change password done |
| 3 | Batches/departments/registration numbers | Not Started | |
| 4 | Run vs Submit, hidden tests, server grading, verdicts, weights | Tested | |
| 4 | Local judge (5 languages) with limits | Tested | Dev only |
| 4 | Docker judge | Implemented | Untested: no Docker daemon here |
| 4 | Redis/BullMQ queue, queue monitoring UI | Not Started | In-process bounded queue only |
| 4 | Editor features (formatting, fullscreen, SQL) | In Progress | Monaco, themes, font size, persistence done |
| 5 | Teacher problem CRUD with ownership | Tested | Tags/editorial/complexity not done |
| 6–10 | Assessments, contests, leaderboards, notifications, discussions, analytics | Not Started | |
| 11 | Load tests, caching, indexes review | Not Started | No scale claims made |
| 12 | Security audit doc, dependency audit | Not Started | |
| 13 | Deployment guide | Not Started | README covers local setup |

## Next
1. Run against a real MongoDB; run the Docker judge on a host with Docker.
2. Rotate the leaked credentials; run `migrate-legacy.js --dry-run`.
3. Phase 3 (accounts), then assessments.
