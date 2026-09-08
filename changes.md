## [2026-09-08 16:20:00] — MVP Phase 1: PDF → Question (PDF Ingestion Pipeline)

### Summary of Changes
- **Schema (`packages/db/src/schema/ingestion.ts`)**:
  - Added `sourceBlocks` table: `id`, `documentId`, `pageId`, `pageNumber`, `blockIndex`, `content`, `kind` (text/figure/table/equation), `bbox`. Indexes on `(documentId)`, `(pageId)`, `(pageId, blockIndex)`.
  - Added `extractedQuestions` staging table: `id`, `sourceDocumentId`, `pageStart`, `pageEnd`, `startBlockId`, `endBlockId`, `number`, `statement`, `options` (jsonb), `answerKey` (jsonb), `confidence`, `status` (pending/review/stable). Indexes on `(sourceDocumentId)`, `(status)`.
  - Generated migration `20260908154738_tough_cerise` via `bun db:generate`.

- **Worker Jobs (`apps/worker/src/handlers.ts`)**:
  - `extract_document`: Deterministic PDF text extraction via `pdf-parse` → populates `sourcePages`, `sourceBlocks`, `provenance`.
  - `normalize_document`: Whitespace/Unicode cleanup of page and block content.
  - `segment_questions`: Deterministic heuristics (numbering patterns `Question 1`, `(1)`, `1.`, option detection `A.`, `B)`, etc.) over `sourceBlocks` → `extractedQuestions`.
  - `extract_answers`: Pulls answer key from known answer blocks / option mapping → `extractedQuestions.answerKey`, promotes to `stable` or `review`.
  - Exported helper functions: `getStoragePath`, `normalizeText`, `detectBlockKind`, `splitIntoBlocks` for testability.

- **API (`backend/src/modules/documents/index.ts`)**:
  - `POST /v1/documents` — Persist `sourceDocuments` row, enqueue `extract_document` job, return `{ id, jobId }`.
  - `POST /v1/documents/:id/process` — Enqueue/requeue extraction (idempotent).
  - `GET /v1/documents/:id` — Metadata + status.
  - `GET /v1/documents/:id/pages` — List pages.
  - `GET /v1/documents/:id/blocks` — List blocks (optional `?page=` filter).
  - `GET /v1/documents/:id/questions` — List `extractedQuestions` (filter `?status=`).
  - `GET /v1/documents/:id/jobs` — List worker jobs for document.
  - Registered `documentsModule` in `backend/src/modules/api/index.ts`.

- **Infrastructure & Config**:
  - Added `pdf-parse` dependency to `apps/worker` with type declarations in `global.d.ts` and `packages/config/src/pdf-parse.d.ts`.
  - Added `fatal` log level to `packages/config/src/logger.ts`.
  - Exported `WorkerQueueManager` from `apps/worker/src/index.ts` for API consumption.
  - Switched backend logger to use `@openlearning/config` logger.

- **Seed Data (`packages/db/src/seed.ts`)**:
  - Extended with fixture `sourceDocument` (`doc_fixture_math_01`), 2 pages, 11 blocks, 2 extracted questions with answer keys, and provenance entries.

- **Tests (`apps/worker/src/handlers.test.ts`)**:
  - Unit tests for `normalizeText`, `detectBlockKind`, `splitIntoBlocks` helpers.
  - Unit tests for question segmentation regex patterns (numbering, options).
  - Unit tests for answer key detection patterns.

- **Verification**:
  - `bun run typecheck` → 0 errors across all workspaces (config, domain, db, backend, frontend, worker).
  - `bun test` → 51 tests pass across 8 files, 0 failures.

## [2026-09-07 16:50:00] — MVP Phase 0 Gap Closure (Epics 4 & 5 Completion)

### Summary of Changes
- **Epic 4 — Backend API Contract Hardening**:
  - Added explicit TypeBox `response` schemas (200, 400, 404, 500) to `/v1/scopes`, `/v1/skills`, and `/v1/problems` route handlers.
  - Introduced `notFound(entity)` helper in `backend/src/commons/modules/error-handler.ts` for standardized 404 responses.
  - Wrapped `/:id` route DB queries in try/catch blocks to return standardized 500 error responses instead of propagating uncaught exceptions.
  - Expanded `backend/src/index.test.ts` with integration tests covering 404 paths, unknown route error shape, POST round-trip, and standardized error response validation (11 tests total).
- **Epic 5 — Background Worker Hardening**:
  - Replaced SELECT-then-UPDATE race condition with atomic `FOR UPDATE SKIP LOCKED` claim SQL in `apps/worker/src/queue.ts`.
  - Added `WORKER_LOCK_TIMEOUT_MS` config (default 300000ms) to `packages/config/src/env.ts`.
  - Added `reclaimStuckJobs()` method to `WorkerQueueManager` for reclaiming expired `processing` jobs.
  - Refactored `apps/worker/src/index.ts` to export `startWorkerDaemon({ signal, pollIntervalMs })` returning a `WorkerController` for testability.
  - Added `apps/worker/src/queue.integration.test.ts` with integration tests for end-to-end job processing, unknown job type failure path, and retry logic (7 tests + integration tests).
  - Added daemon smoke test in `apps/worker/src/index.test.ts` that boots the loop, processes a `ping_job`, and aborts cleanly.
- **Verification**:
  - `bun run typecheck` → 0 errors across all workspaces.
  - `bun test` → 28 tests pass across 7 files, 0 failures.

## [2026-09-06 23:32:00] - Complete MVP Phase 0 (Foundations) Implementation

### Summary of Changes
- **Epic 1 (Monorepo & Config)**:
  - Created `@openlearning/config` package with Zod-validated environment parser (`env.ts`) and structured JSON logger (`logger.ts`).
  - Configured Bun workspaces in root `package.json` linking `packages/*` and `apps/*`.
  - Added path aliases for `@openlearning/*` in root and package `tsconfig.json` files.
- **Epic 2 (Domain Architecture)**:
  - Created `@openlearning/domain` package with canonical domain models: `KnowledgeScope`, `KnowledgeNode`, `KnowledgeRelation`, `Skill`, `Problem`, `SolutionApproach`, `SolutionStep`, `Assessment`, `AssessmentItem`, `Attempt`, `ItemResult`.
  - Implemented Zod schemas, type guards (`isKnowledgeNode`, `isProblem`, `isAssessment`, `isSkill`), and unit test suite (100% pass).
- **Epic 3 (Database & Migration Engine)**:
  - Created `@openlearning/db` package with Drizzle ORM PostgreSQL schemas (`users`, `repositories`, `scopes`, `skills`, `knowledge_nodes`, `problems`, `assessments`, `ingestion`, `worker_jobs`).
  - Implemented Drizzle client factory (`client.ts`), seed script (`seed.ts`), generated SQL migrations (`bun db:generate`), and DB unit test suite (100% pass).
- **Epic 4 (Backend API Framework)**:
  - Built REST modules in `@openlearning/backend`: `/health`, `/v1/scopes`, `/v1/skills`, `/v1/problems`.
  - Added type-checked endpoints, Swagger docs, global error handler, and integration tests using `bun test` (100% pass).
- **Epic 5 (Background Worker Engine)**:
  - Created `@openlearning/worker` daemon package (`apps/worker`).
  - Implemented Postgres-backed `WorkerQueueManager` (`queue.ts`) handling polling, locks, timeouts, and state transitions (`pending` → `processing` → `completed` | `failed`).
  - Created `ping_job` and `document_extract_stub` handlers and unit test suite (100% pass).
- **Epic 6 (Full Stack Orchestration & DX)**:
  - Updated `docker-compose.yaml` to include openlearning services (`postgres`, `backend`, `worker`, `frontend`, `nginx`).
  - Verified `bun test` across all packages (19 tests passed, 0 failures).
  - Verified `bun run typecheck` across all workspace packages (0 errors, 0 `any`).
  - Updated `PROJECT_DESCRIPTION.md`, `plan.md`, `task.md` artifact, and `changes.md`.

## [2026-09-06 22:54:00] - Plan MVP Phase 0 (Foundations)

### Changes
- Analyzed `learning-repository-adaptive-practice-platform-v0.2.md` Section 76 and Appendices A–D for MVP Phase 0 requirements.
- Created `implementation_plan.md` artifact detailing Epics 1 through 6, Steps, Tasks, and Verification criteria.
- Created `plan.md` in root workspace for task tracking and step verification.
- Created `task.md` artifact for execution progress tracking.
- Updated `PROJECT_DESCRIPTION.md` with the MVP Phase 0 engineering roadmap.
