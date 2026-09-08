# Project Description

This is a monolithic repository containing a Next.js frontend and an ElysiaJS backend, using Drizzle ORM and Postgres database, orchestrated via Docker Compose.

## Project Structure
- `/frontend`: Next.js frontend application.
- `/backend`: ElysiaJS backend application.
- `/nginx`: NGINX configuration for reverse proxying requests.
- `docker-compose.yaml`: Docker compose configuration for running Postgres, backend, frontend, and nginx.
- `/packages/config`: Shared configuration (env validation, logger).
- `/packages/domain`: Domain models and type guards.
- `/packages/db`: Drizzle ORM schemas, client, and seeding.
- `/apps/worker`: Background worker for document processing.

## Task Overview

### Nginx Integration
- Created an Nginx reverse proxy to route traffic:
  - `/api/` -> routes to `backend:3001/` (stripping the `/api/` prefix)
  - `/` -> (Optional) routes to `frontend:3000`. Currently commented out in `nginx/nginx.conf`.
- Updated `docker-compose.yaml` to include the Nginx service on port 80.

### Husky & Linting Setup
- Configured Husky with a `pre-commit` hook that triggers `lint-staged`.
- Moved `lint-staged` configuration to `.lintstagedrc.js` to support advanced workflows:
  - **Type Checking**: Runs `bun typecheck` (tsc --noEmit) for the relevant package whenever TypeScript files are staged.
  - **Linting & Formatting**: Uses Biome for backend and ESLint for frontend on staged files.
  - **Database Migrations**: Automatically runs `bun db:generate` in the backend only when database schema files (`backend/src/database/schema/**/*.ts`) are modified.
- This setup ensures that checks are optimized and only run when relevant files change, while still maintaining full project context for type checking.

### Elysia API Endpoints & Testing
- Created an example Elysia API endpoint (`/example`) in `backend/src/modules/example/index.ts`.
- Followed Elysia best practices by isolating route definitions (`index.ts`) and type schemas (`model.ts`) inside the module.
- Standardized the response shape using the shared `baseResponseSchema` from `backend/src/commons/types/index.ts`.
- **RECOMMENDED PRACTICE**: Define response schemas for each status code (e.g., 200, 400, 404, 500) explicitly in the route definition's `response` object instead of throwing custom HTTP errors from `backend/src/commons/errors/index.ts`. Using `throw new Error(...)` causes the response shape to be omitted from the Swagger/API Docs.
- Registered the `/example` module in the main `backend/src/index.ts` app.
- Added automated unit tests using `bun test` in `backend/src/modules/example/index.test.ts` to ensure stability and validate inputs/outputs.

### Global Error Handling
- Refactored backend error handling to use a centralized `errorHandlerModule` in `backend/src/commons/modules/error-handler.ts`.
- Introduced custom HTTP error classes (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `InternalServerError`) in `backend/src/commons/errors/index.ts`.
- Standardized error response using `errorResponseSchema` from `backend/src/commons/types/index.ts` to include: `success: false`, `message`, `status`, `timestamp`, and `details` (specifically for mapping validation issues).
- Updated frontend `api.ts` `getEdenErrorMessage` utility to gracefully parse the new standardized response, parsing and concatenating validation field errors if `details` exist.
- Created test endpoints under `/error-example` (`backend/src/modules/error-example/index.ts`) to verify error handling behavior.

## MVP Phase 0 — Engineering Foundations & Package Responsibilities

### Monorepo Architecture & Package Map
- **`packages/config`**:
  - `src/env.ts`: Schema validation for environment variables using Zod (`DATABASE_URL`, `PORT`, `LOG_LEVEL`, `WORKER_CONCURRENCY`, `WORKER_POLL_INTERVAL_MS`, `WORKER_LOCK_TIMEOUT_MS`).
  - `src/logger.ts`: Structured JSON logger class supporting log levels (`debug`, `info`, `warn`, `error`, `fatal`) and context payload formatting.
- **`packages/domain`**:
  - `src/base.ts`: Base `Entity` interface and `ID` type.
  - `src/scope.ts`: `KnowledgeScope` domain model.
  - `src/knowledge.ts`: `KnowledgeNode` and `KnowledgeRelation` domain models & kinds.
  - `src/skill.ts`: `Skill` domain model.
  - `src/problem.ts`: `Problem`, `SolutionApproach`, `SolutionStep` domain models.
  - `src/assessment.ts`: 4-layer assessment hierarchy (`Problem` → `Assessment` → `AssessmentItem` → `Attempt`).
  - `src/index.ts`: Re-exports domain entities and type guards (`isKnowledgeNode`, `isProblem`, `isAssessment`, `isSkill`).
- **`packages/db`**:
  - `src/schema/*`: Drizzle ORM PostgreSQL schemas (`users`, `repositories`, `scopes`, `skills`, `knowledge_nodes`, `problems`, `solution_approaches`, `assessments`, `source_documents`, `source_pages`, `source_blocks`, `extracted_questions`, `provenance`, `ai_artifacts`, `worker_jobs`).
  - `src/client.ts`: Drizzle client factory & pool management (`createDbClient`, `getPgPool`).
  - `src/seed.ts`: Database seeder script for baseline scopes, skills, nodes, test problems, and fixture documents for PDF ingestion testing.
- **`apps/worker`**:
  - `src/queue.ts`: `WorkerQueueManager` managing Postgres-backed job polling, state transitions (`pending` → `processing` → `completed` | `failed`), retries, and locks using atomic `FOR UPDATE SKIP LOCKED` claim.
  - `src/handlers.ts`: Job handlers registry (`ping_job`, `document_extract_stub`, `extract_document`, `normalize_document`, `segment_questions`, `extract_answers`).
  - `src/index.ts`: Background worker daemon entrypoint exporting `startWorkerDaemon` and `WorkerQueueManager` for programmatic control.
- **`backend`**:
  - `src/modules/health`: `GET /health` system health endpoint.
  - `src/modules/scopes`: REST endpoints `GET /v1/scopes` & `GET /v1/scopes/:id`.
  - `src/modules/skills`: REST endpoints `GET /v1/skills` & `GET /v1/skills/:id`.
  - `src/modules/problems`: REST endpoints `GET /v1/problems`, `GET /v1/problems/:id`, `POST /v1/problems`.
  - `src/modules/documents`: REST endpoints `POST /v1/documents`, `POST /v1/documents/:id/process`, `GET /v1/documents/:id`, `GET /v1/documents/:id/pages`, `GET /v1/documents/:id/blocks`, `GET /v1/documents/:id/questions`, `GET /v1/documents/:id/jobs`.

### Feature Flows & Execution Pipeline
1. **API Handling**: Client HTTP requests arrive at Nginx (`:80`) → routed to Elysia API (`:3001`). Input validated using TypeBox schemas → DB query executed via `@openlearning/db` → standardized JSON response returned.
2. **Standardized Response Contract**: All API endpoints declare explicit TypeBox schemas for 200, 400, 404, and 500 status codes using `baseResponseSchema` and `errorResponseSchema`. The shared `notFound(entity)` helper in `backend/src/commons/modules/error-handler.ts` produces the standardized 404 shape: `{ success: false, message, status: 404, details: null, timestamp }`. Never `throw new Error(...)` inside handlers; let the centralized error handler manage errors.
3. **Worker Processing**: Background tasks are enqueued into `worker_jobs` DB table → `WorkerQueueManager` atomically claims jobs using `FOR UPDATE SKIP LOCKED` → runs handler in `apps/worker/src/handlers.ts` → updates status to `completed` or `failed`. Lock timeout is configurable via `WORKER_LOCK_TIMEOUT_MS` (default 300000ms = 5min). Stuck `processing` jobs are reclaimable via `reclaimStuckJobs()`.
4. **Document Ingestion Pipeline (Phase 1)**:
   - `POST /v1/documents` — Creates `sourceDocuments` row, enqueues `extract_document` job.
   - `extract_document` — Uses `pdf-parse` to extract text from PDF → populates `sourcePages`, `sourceBlocks`, `provenance`.
   - `normalize_document` — Unicode/whitespace cleanup of page and block content.
   - `segment_questions` — Deterministic heuristics (numbering patterns, option detection) over `sourceBlocks` → `extractedQuestions`.
   - `extract_answers` — Pulls answer key from known answer blocks → updates `extractedQuestions.answerKey`, promotes to `stable` or `review`.
   - `GET /v1/documents/:id/questions` — Lists extracted questions with optional `?status=` filter.
5. **Database Migrations & Seeding**: `bun db:generate` creates SQL migrations in `packages/db/drizzle`. `bun db:seed` inserts baseline scopes, skills, test problems, and fixture documents.

## MVP Phase 1 — PDF → Question (COMPLETED)

### Schema (`packages/db/src/schema/ingestion.ts`)
- Added `sourceBlocks` table: `id`, `documentId`, `pageId`, `pageNumber`, `blockIndex`, `content`, `kind` (text/figure/table/equation), `bbox`. Indexes on `(documentId)`, `(pageId)`, `(pageId, blockIndex)`.
- Added `extractedQuestions` staging table: `id`, `sourceDocumentId`, `pageStart`, `pageEnd`, `startBlockId`, `endBlockId`, `number`, `statement`, `options` (jsonb), `answerKey` (jsonb), `confidence`, `status` (pending/review/stable). Indexes on `(sourceDocumentId)`, `(status)`.

### Worker Jobs (`apps/worker/src/handlers.ts`)
- `extract_document`: Deterministic PDF text extraction via `pdf-parse` → populates `sourcePages` + `sourceBlocks` + `provenance` rows.
- `normalize_document`: Whitespace/Unicode cleanup before segmentation.
- `segment_questions`: Deterministic heuristics (numbering patterns `Question 1`, `(1)`, `1.`, option detection `A.`, `B)`, etc.) over `sourceBlocks` → `extractedQuestions`.
- `extract_answers`: Pulls answer key from known answer blocks / option mapping → `extractedQuestions.answerKey`.
- Chain: `extract_document` → `normalize_document` → `segment_questions` → `extract_answers` (enqueued sequentially via API).

### API (`backend/src/modules/documents/`)
- `POST /v1/documents` — Persist `sourceDocuments` row, enqueue `extract_document` job, return `{ id, jobId }`.
- `POST /v1/documents/:id/process` — Enqueue/requeue extraction (idempotent).
- `GET /v1/documents/:id` — Metadata + status.
- `GET /v1/documents/:id/pages` — List pages.
- `GET /v1/documents/:id/blocks` — List blocks (optional `?page=` filter).
- `GET /v1/documents/:id/questions` — List `extractedQuestions` (filter `?status=`).
- `GET /v1/documents/:id/jobs` — List worker jobs for document.

### Deterministic Validation
- Rule checks on `extractedQuestions`: non-empty `statement`; option count matches detected type; `answerKey` present; page/block spans valid. On failure → set `status='review'`, do NOT auto-promote.

### Seed + Tests
- Extended `packages/db/src/seed.ts` with representative `sourceDocument`/`sourcePages`/`sourceBlocks`/`extractedQuestions` fixture data.
- Unit tests for segmentation rules (numbering/option heuristics) in `apps/worker/src/handlers.test.ts`.

### DX / Infra
- Added `pdf-parse` (deterministic) to `apps/worker` deps.
- TypeScript declarations for `pdf-parse` in `global.d.ts` and `packages/config/src/pdf-parse.d.ts`.

## Future Updates & Ideas
- Update environment variables configuration in frontend. Currently it seems to have remnants of Vite (`import.meta.env`) but uses Next.js (`process.env.NEXT_PUBLIC_...`).
- Verify if any WebSocket proxying needs adjustments for ElysiaJS or Next.js HMR.
- Verify Elysia backend correctly parses requests from the Nginx proxy if client IPs are needed.
- Phase 2: Solution→canonical Problem/Assessment linking, skill classification.
- Phase 7: AI enrichment for question extraction (improve confidence, handle edge cases).

## Notes & Warnings
- When adding new services or changing ports, update Nginx configuration accordingly.
- Always use `bun.js` (`bun test`, `bun typecheck`, `bun dev`) for script execution across workspace packages.
- Phase 1 stores uploaded PDFs on **local disk** under `./storage/pdfs/` (mounted volume in `docker-compose.yaml`). `sourceDocuments.storagePath` is a relative path string. Design for future S3 migration via `getDocumentPath(storagePath)` helper.
- Tier 2 legacy resources (`backend/src/database/`, `backend/src/modules/profile/`, `frontend/`, `better-auth`, `drizzle-typebox`, `pglite`, `pino-pretty`) are marked for removal in a future cleanup but not yet removed (auth/UI deferred to later phase).


