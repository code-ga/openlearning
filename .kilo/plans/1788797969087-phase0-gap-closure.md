# MVP Phase 0 — Gap Closure Plan

> **Goal**: Close the remaining unchecked tasks in `plan.md` before opening Phase 1 (PDF → Question). Scope is intentionally limited to finishing Epics 4 & 5, hardening the API contract, and validating the worker through end-to-end tests.

---

## Context

`plan.md` shows Epic 4 (Backend API Framework) and Epic 5 (Background Worker Engine) still in-progress / not-started, while Epics 1, 2, 3, and 6 are marked complete. Audit of the actual code (`backend/src/modules/**`, `apps/worker/src/**`, `packages/db/src/schema/worker.ts`) shows:

- Backend already exposes `/health`, `/v1/scopes`, `/v1/skills`, `/v1/problems` via Elysia with a centralized error handler and Swagger. **Missing**: integration tests for these endpoints, and a single, audited standard for the 4 status-code response shapes (200/400/404/500).
- Worker `WorkerQueueManager` does poll → lock → execute → complete/fail transitions, but the lock is a SELECT-then-UPDATE (race condition between workers), there is no reclaim of `processing` jobs whose `locked_at` has expired, and there are no integration tests driving jobs through the full enqueue → process → assert cycle.
- `apps/worker/src/index.ts` daemon exists; needs a smoke test that boots the loop, processes a `ping_job`, and exits cleanly.

Phase 1 (PDF → Question) depends on a trustworthy worker + API contract, so we close these gaps first.

---

## Epic 7 — Backend API Contract Hardening & Integration Tests

### Step 7.1 — Standardized Response Schemas (audit & finalize)
- **Task 7.1.1**: For each domain module (`scopes`, `skills`, `problems`), ensure `route.get`/`.post` declares a `response` object with explicit TypeBox schemas for `200`, `400`, `404`, `500`. Reuse `baseResponseSchema` / `errorResponseSchema` from `backend/src/commons/types/index.ts` — never `throw new Error(...)` inside handlers (per `PROJECT_DESCRIPTION.md` recommendation).
- **Task 7.1.2**: Add `404` returns (currently most endpoints just don't define a 404 path) for the `/:id` routes by returning an error response with status `404` rather than letting Elysia emit its default.
- **Task 7.1.3**: Add a shared helper `notFound(entity)` in `backend/src/commons/modules/error-handler.ts` that produces the standardized 404 shape.
- *Verification*: `bun run typecheck` and a manual `app.handle(new Request('/v1/scopes/non-existent'))` returns `404` with `{ success: false, message, status: 404, timestamp, details: null }`.

### Step 7.2 — API Integration Test Suite
- **Task 7.2.1**: Create `backend/src/index.test.ts` (or expand the existing one) that:
  - Boots the Elysia app via `app.handle(...)` (no real HTTP listener).
  - Asserts `GET /health` → `{ success: true, ... }`.
  - Asserts `GET /v1/scopes` returns the seeded scopes from `packages/db/src/seed.ts`.
  - Asserts `GET /v1/scopes/:id` happy path and 404 path.
  - Asserts `GET /v1/skills` and `GET /v1/skills/:id` happy + 404 paths.
  - Asserts `GET /v1/problems` and `POST /v1/problems` (round-trip create → read).
  - Asserts an unknown route returns the standardized error shape.
- **Task 7.2.2**: Tests run against an ephemeral Postgres (reuse existing `docker compose up postgres` pattern or `bun:test` DB fixture); ensure they are isolated and re-runnable.
- *Verification*: `bun test backend` → 100% pass, no `any`, no skipped.

---

## Epic 8 — Worker Hardening & Integration Tests

### Step 8.1 — Locking & Timeout Hardening
- **Task 8.1.1**: Replace the current `SELECT … WHERE status='pending'` + blind `UPDATE` with a single atomic claim:
  ```sql
  UPDATE worker_jobs
     SET status='processing', locked_by=$1, locked_at=now(), attempts=attempts+1, updated_at=now()
   WHERE id = (
     SELECT id FROM worker_jobs
      WHERE status='pending'
        AND (locked_at IS NULL OR locked_at < now() - interval '5 minutes')
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
   )
   RETURNING *;
  ```
  Implement using Drizzle's `sql` template tag in `apps/worker/src/queue.ts`.
- **Task 8.1.2**: Add a configurable `WORKER_LOCK_TIMEOUT_MS` to `packages/config/src/env.ts` (default `300_000` = 5 min) and pass it into `WorkerQueueManager`.
- **Task 8.1.3**: Add unit tests for: (a) two concurrent `pollAndProcessNextJob` calls process distinct jobs (no double-processing), (b) a job stuck in `processing` past the lock timeout is reclaimed on next poll.
- *Verification*: `bun test apps/worker` → all unit tests pass.

### Step 8.2 — Worker End-to-End Integration Test
- **Task 8.2.1**: Write `apps/worker/src/queue.integration.test.ts` that:
  - Enqueues a `ping_job` via `WorkerQueueManager.enqueueJob`.
  - Calls `pollAndProcessNextJob()` once.
  - Asserts the row in `worker_jobs` has `status='completed'`, `result.pong === true`, `completedAt` set, `attempts === 1`.
- **Task 8.2.2**: Write a failure-path test: enqueue an unknown job type, assert `status='failed'` and `error` contains "No registered handler".
- **Task 8.2.3**: Write a retry test: register a handler that throws twice then succeeds; assert final state is `completed` with `attempts === 3`.
- *Verification*: `bun test apps/worker` → all unit + integration tests pass.

### Step 8.3 — Daemon Smoke Test
- **Task 8.3.1**: Refactor `apps/worker/src/index.ts` to export a `startWorker({ signal, pollIntervalMs })` function returning a controller (so tests can start/stop it).
- **Task 8.3.2**: Add a test that starts the daemon, enqueues a `ping_job`, polls the DB until status=`completed` (with a 10 s timeout), then aborts.
- *Verification*: `bun test apps/worker` includes the daemon smoke test; no leaked intervals.

---

## Epic 9 — Documentation, Plan Update & Final Verification

### Step 9.1 — Update Project Artifacts
- **Task 9.1.1**: Mark Epic 4 Steps 4.1–4.3 and Epic 5 Steps 5.1–5.2 as `[x]` in `plan.md`.
- **Task 9.1.2**: Update `PROJECT_DESCRIPTION.md` to document:
  - Standardized 4-status response contract (200/400/404/500).
  - `WORKER_LOCK_TIMEOUT_MS` config and reclaim semantics.
  - Atomic claim SQL pattern.
- **Task 9.1.3**: Append a new entry to `changes.md` with timestamp header summarizing the gap-closure work.

### Step 9.2 — Final Verification
- **Task 9.2.1**: `bun run typecheck` across all workspaces → 0 errors, 0 `any`.
- **Task 9.2.2**: `bun test` across all workspaces → 100% pass.
- **Task 9.2.3**: `docker compose up -d postgres backend worker` → both services healthy.
- *Verification*: clean lint/typecheck/test pass + manual `curl /health` and a worker job round-trip.

---

## Risks & Open Decisions

- **Test DB isolation**: tests need a clean Postgres state. Recommend a dedicated `openlearning_test` DB in `docker-compose.yaml` plus a `beforeEach` truncate in the integration test helpers. If the user prefers testcontainers, flag for clarification before implementing.
- **Lock-timeout value**: 5 minutes is a guess. Should be tunable per environment; default is fine for MVP but documented as configurable.
- **Existing `document_extract_stub` handler**: leave untouched; it becomes the seed for Phase 1's real `extract_pdf` handler.
- **Out of scope for this epic**: PDF parsing, question segmentation, AI enrichment, search, student state, adaptive practice, exam generation, repository contributions, semantic search, advanced calibration, cross-subject expansion. All deferred to subsequent phases per `learning-repository-adaptive-practice-platform-v0.2.md` §78 onward.

---

## Validation Checklist (run before closing)

- [ ] `bun run typecheck` — 0 errors, no `any`
- [ ] `bun test` — 100% pass across `packages/*` and `apps/*`
- [ ] `GET /health` → 200 with standard shape
- [ ] `GET /v1/scopes/missing` → 404 with standard shape
- [ ] Concurrent worker poll → no double-process, no lost job
- [ ] Stuck `processing` job reclaimed after `WORKER_LOCK_TIMEOUT_MS`
- [ ] `ping_job` end-to-end via daemon → `completed`
- [ ] `plan.md` reflects all completed tasks
- [ ] `changes.md` and `PROJECT_DESCRIPTION.md` updated
