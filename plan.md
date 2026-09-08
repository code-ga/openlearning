# MVP Phase 0 — Foundations: Plan & Task Tracker

> **Phase Goal**: Build the core engineering skeleton (Bun monorepo, domain models, PostgreSQL + Drizzle ORM, Elysia API, Background Worker engine, structured logging, configuration, and automated test suite).

---

## Task Progress Summary

- [x] **Epic 1: Repository & Monorepo Infrastructure (Bun Workspaces)**
  - [x] **Step 1.1: Bun Workspaces & Package Boundaries**
    - [x] Task 1.1.1: Configure root `package.json` with workspace packages (`packages/domain`, `packages/db`, `packages/config`, `apps/api`, `apps/worker`).
    - [x] Task 1.1.2: Configure `tsconfig.json` with strict type-checking & path aliases (`@openlearning/*`).
    - [x] Task 1.1.3: Add unified root scripts (`bun dev`, `bun test`, `bun typecheck`, `bun db:migrate`).
    - [x] *Verification*: `bun install` & `bun typecheck` pass.
  - [x] **Step 1.2: Environment Configuration & Structured Logging**
    - [x] Task 1.2.1: Define schema-validated environment configuration using Zod (`packages/config`).
    - [x] Task 1.2.2: Implement structured JSON logger supporting `info`, `warn`, `error`, `debug`.
    - [x] *Verification*: `bun test packages/config` passes.

- [x] **Epic 2: Core Domain Model Architecture (`packages/domain`)**
  - [x] **Step 2.1: Base Entities & Knowledge Graph Models**
    - [x] Task 2.1.1: Define `Entity`, `ID`, and `KnowledgeScope` domain models and Zod schemas.
    - [x] Task 2.1.2: Define `KnowledgeNode` and `KnowledgeRelation` domain entities and relation types.
    - [x] *Verification*: Unit tests verifying entity factories and Zod schema validations.
  - [x] **Step 2.2: Problem, Assessment & Skill Domain Models**
    - [x] Task 2.2.1: Define `Skill` and `Problem` entities with assumptions, goals, and solution approaches.
    - [x] Task 2.2.2: Define `SolutionApproach` and `SolutionStep` domain models.
    - [x] Task 2.2.3: Define 4-layer assessment hierarchy (`Problem` → `Assessment` → `AssessmentItem` → `Attempt`).
    - [x] *Verification*: Unit tests verifying single_choice, true_false, and multiple_choice assessments.
  - [x] **Step 2.3: Domain Type Guards & Unit Test Suite**
    - [x] Task 2.3.1: Implement type guard functions for domain entities.
    - [x] Task 2.3.2: Create unit test suite in `packages/domain`.
    - [x] *Verification*: `bun test packages/domain` passes with 0 `any` types.

- [x] **Epic 3: Database & Migration Engine (`packages/db`)**
  - [x] **Step 3.1: Drizzle Relational Schema Definition**
    - [x] Task 3.1.1: Implement Drizzle table definitions (`users`, `repositories`, `scopes`, `skills`, `knowledge_nodes`, `knowledge_relations`, `problems`, `solution_approaches`, `assessments`, `attempts`, `source_documents`, `provenance`, `worker_jobs`).
    - [x] Task 3.1.2: Add indexes, foreign key constraints, and soft deletion (`deleted_at`).
    - [x] *Verification*: `bun typecheck` on `packages/db` passes.
  - [x] **Step 3.2: Migrations & Seed System**
    - [x] Task 3.2.1: Configure `drizzle.config.ts`, generate migrations (`bun db:generate`), and create migration script (`bun db:migrate`).
    - [x] Task 3.2.2: Create seed script (`packages/db/src/seed.ts`) populating baseline scopes, skills, and test problems.
    - [x] *Verification*: DB migrations apply cleanly and seed populates data.
  - [x] **Step 3.3: DB Integration Test Suite**
    - [x] Task 3.3.1: Write DB integration tests in `packages/db/src/index.test.ts`.
    - [x] *Verification*: `bun test packages/db` passes.

- [x] **Epic 4: Backend API Framework (`backend/`)**
  - [x] **Step 4.1: Framework, Middleware & Swagger Setup**
    - [x] Task 4.1.1: Wire global error handler middleware, CORS, and Swagger UI (`/swagger`).
    - [x] Task 4.1.2: Implement system health check endpoint (`GET /health`).
    - [x] *Verification*: `GET /health` returns 200 OK and `/swagger` loads.
  - [x] **Step 4.2: Foundation Domain REST Endpoints**
    - [x] Task 4.2.1: Implement `/api/v1/scopes` endpoints.
    - [x] Task 4.2.2: Implement `/api/v1/skills` endpoints.
    - [x] Task 4.2.3: Implement `/api/v1/problems` endpoints.
    - [x] Task 4.2.4: Standardize response schemas (200, 400, 404, 500).
    - [x] *Verification*: API endpoints return standard response shapes.
  - [x] **Step 4.3: API Integration Tests**
    - [x] Task 4.3.1: Write integration tests using Elysia `app.handle` and `bun test`.
    - [x] *Verification*: `bun test backend` passes (11 tests).

- [x] **Epic 5: Background Worker Engine (`apps/worker`)**
  - [x] **Step 5.1: Worker Execution Architecture & Queue Processor**
    - [x] Task 5.1.1: Implement Postgres-backed `WorkerQueueManager` handling job polling, locks, timeouts, and state machine transitions.
    - [x] Task 5.1.2: Define standard `WorkerJob` interface and registry.
    - [x] *Verification*: Unit tests verifying worker locking and queue transitions.
  - [x] **Step 5.2: Phase 0 Demo Worker Job & Worker Entrypoint**
    - [x] Task 5.2.1: Implement `ping_job` and document processing stub handler.
    - [x] Task 5.2.2: Wire `apps/worker/src/index.ts` daemon process.
    - [x] Task 5.2.3: Write worker integration tests for job enqueueing and processing.
    - [x] *Verification*: `bun test apps/worker` passes (7 tests + integration tests).

- [x] **Epic 6: Full Stack Orchestration, Verification & DX Polish**
  - [x] **Step 6.1: Monorepo Orchestration & Docker Compose**
    - [x] Task 6.1.1: Update `docker-compose.yaml` to include API, worker, frontend, Postgres, and Nginx.
    - [x] Task 6.1.2: Update root `package.json` with dev/test scripts.
    - [x] *Verification*: `bun dev` initializes all services without errors.
  - [x] **Step 6.2: End-to-End Verification & Knowledge Documentation**
    - [x] Task 6.2.1: Execute `bun typecheck` across all packages (0 errors, 0 `any`).
    - [x] Task 6.2.2: Execute `bun test` across all packages.
    - [x] Task 6.2.3: Update `PROJECT_DESCRIPTION.md` and `changes.md` with task details and summaries.
    - [x] *Verification*: Complete test pass and updated documentation.

---

# MVP Phase 1 — PDF → Question: Plan & Task Tracker

> **Phase Goal**: Deliver PDF ingestion pipeline: `PDF → pages → blocks → questions → answers → provenance` (v0.2 §77). Deterministic first; no sophisticated AI.

---

## Task Progress Summary

- [x] **Epic 1: Schema & Migration**
  - [x] **Step 1.1: Ingestion Schema Extension (`packages/db/src/schema/ingestion.ts`)**
    - [x] Task 1.1.1: Add `sourceBlocks` table with columns: `id`, `documentId`, `pageId`, `pageNumber`, `blockIndex`, `content`, `kind`, `bbox`.
    - [x] Task 1.1.2: Add `extractedQuestions` staging table with columns: `id`, `sourceDocumentId`, `pageStart`, `pageEnd`, `startBlockId`, `endBlockId`, `number`, `statement`, `options`, `answerKey`, `confidence`, `status`.
    - [x] Task 1.1.3: Add indexes on `(documentId)`, `(pageId)`, `(pageId, blockIndex)` for `sourceBlocks`; `(sourceDocumentId)`, `(status)` for `extractedQuestions`.
    - [x] *Verification*: `bun --cwd packages/db db:generate` produces migration `20260908154738_tough_cerise`.

- [x] **Epic 2: Worker Jobs (`apps/worker/src/handlers.ts`)**
  - [x] **Step 2.1: PDF Extraction Job**
    - [x] Task 2.1.1: Add `pdf-parse` dependency to `apps/worker`.
    - [x] Task 2.1.2: Implement `extract_document` handler: read PDF from `storagePath`, parse with `pdf-parse`, populate `sourcePages`, `sourceBlocks`, `provenance`.
    - [x] Task 2.1.3: Add TypeScript declarations for `pdf-parse` (`global.d.ts`, `packages/config/src/pdf-parse.d.ts`).
    - [x] *Verification*: Typecheck passes; handler compiles.
  - [x] **Step 2.2: Normalization Job**
    - [x] Task 2.2.1: Implement `normalize_document` handler: whitespace/Unicode cleanup of page and block content.
    - [x] *Verification*: Typecheck passes.
  - [x] **Step 2.3: Question Segmentation Job**
    - [x] Task 2.3.1: Implement `segment_questions` handler: deterministic heuristics (numbering patterns, option detection) over `sourceBlocks` → `extractedQuestions`.
    - [x] Task 2.3.2: Export helper functions: `normalizeText`, `detectBlockKind`, `splitIntoBlocks`.
    - [x] *Verification*: Typecheck passes; unit tests for regex patterns pass.
  - [x] **Step 2.4: Answer Extraction Job**
    - [x] Task 2.4.1: Implement `extract_answers` handler: pull answer key from known answer blocks / option mapping → `extractedQuestions.answerKey`.
    - [x] Task 2.4.2: Promotion logic: `status='stable'` if answer found, else `status='review'`.
    - [x] *Verification*: Typecheck passes.

- [x] **Epic 3: Document Ingestion API (`backend/src/modules/documents/`)**
  - [x] **Step 3.1: REST Endpoints**
    - [x] Task 3.1.1: `POST /v1/documents` — persist `sourceDocuments`, enqueue `extract_document`, return `{ id, jobId }`.
    - [x] Task 3.1.2: `POST /v1/documents/:id/process` — enqueue/requeue extraction (idempotent).
    - [x] Task 3.1.3: `GET /v1/documents/:id` — metadata + status.
    - [x] Task 3.1.4: `GET /v1/documents/:id/pages` — list pages.
    - [x] Task 3.1.5: `GET /v1/documents/:id/blocks` — list blocks (optional `?page=` filter).
    - [x] Task 3.1.6: `GET /v1/documents/:id/questions` — list `extractedQuestions` (filter `?status=`).
    - [x] Task 3.1.7: `GET /v1/documents/:id/jobs` — list worker jobs for document.
    - [x] Task 3.1.8: Register `documentsModule` in `backend/src/modules/api/index.ts`.
    - [x] *Verification*: Typecheck passes; endpoints follow standard response schemas.

- [x] **Epic 4: Seed Data & Fixtures (`packages/db/src/seed.ts`)**
  - [x] **Step 4.1: Fixture Document Data**
    - [x] Task 4.1.1: Add fixture `sourceDocument` (`doc_fixture_math_01`), 2 pages, 11 blocks.
    - [x] Task 4.1.2: Add 2 `extractedQuestions` with options, answer keys, `status='stable'`.
    - [x] Task 4.1.3: Add `provenance` entries for pages and blocks.
    - [x] *Verification*: `bun --cwd packages/db run src/seed.ts` completes without errors.

- [x] **Epic 5: Unit Tests & Deterministic Validation**
  - [x] **Step 5.1: Segmentation Unit Tests (`apps/worker/src/handlers.test.ts`)**
    - [x] Task 5.1.1: Test `normalizeText`, `detectBlockKind`, `splitIntoBlocks` helpers.
    - [x] Task 5.1.2: Test question numbering regex patterns (`Question 1.`, `1)`, etc.).
    - [x] Task 5.1.3: Test option detection regex patterns (`A.`, `B)`, etc.).
    - [x] Task 5.1.4: Test answer key detection regex patterns.
    - [x] *Verification*: `bun test apps/worker` passes.

- [x] **Epic 6: Verification & Documentation**
  - [x] **Step 6.1: Typecheck & Test Suite**
    - [x] Task 6.1.1: `bun run typecheck` → 0 errors across all workspaces.
    - [x] Task 6.1.2: `bun test` → 51 tests pass across 8 files, 0 failures.
  - [x] **Step 6.2: Documentation Updates**
    - [x] Task 6.2.1: Update `PROJECT_DESCRIPTION.md` with Phase 1 architecture, flows, and schema.
    - [x] Task 6.2.2: Update `changes.md` with Phase 1 summary.
    - [x] Task 6.2.3: Update `plan.md` with Phase 1 task tracker.
  - [x] *Verification*: All documentation reflects current implementation.
