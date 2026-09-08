# Phase 1 — PDF → Question (+ v0.2 / Repo Cleanup)

> **Goal:** Deliver MVP Phase 1 from `learning-repository-adaptive-practice-platform-v0.2.md` §77 (PDF → pages → blocks → questions → answers → provenance), and prune plan/docs/repo resources that are neither currently implemented nor in scope for this epic. Phase 0 is complete (`changes.md`); Phase 1 is the next epic.
> **Long-horizon reference:** `learning-repository-adaptive-practice-platform-v0.2.md` is retained as the vision doc — it is scope-stamped here, not deleted.
> **Active tracker:** `plan.md`.
> **Stack:** Bun.js + TypeScript + PostgreSQL (Drizzle ORM) + Elysia API + Postgres-backed worker (`packages/config`, `packages/domain`, `packages/db`, `apps/worker`, `backend`).

---

## 1. Current-State Audit

### 1.1 Implemented & tested (Phase 0 — COMPLETE)
- `packages/config`: `env.ts` (Zod: `DATABASE_URL/PORT/LOG_LEVEL/WORKER_CONCURRENCY/WORKER_POLL_INTERVAL_MS/WORKER_LOCK_TIMEOUT_MS`); `logger.ts`.
- `packages/domain`: `base`, `scope`, `knowledge`, `skill`, `problem`, `assessment` (Zod schemas + `isKnowledgeNode/isProblem/isAssessment/isSkill` type guards).
- `packages/db`: Drizzle schema in `src/schema/{auth,repositories,scopes,skills,knowledge,problems,assessments,ingestion,worker}.ts`; `client.ts` singleton pool; `seed.ts`; migration `20260906162448_curious_martin_li`.
- `apps/worker`: `WorkerQueueManager` (atomic `FOR UPDATE SKIP LOCKED` claim, `reclaimStuckJobs`, retries), `handlers.ts` (`ping_job`, `document_extract_stub`), daemon entrypoint.
- `backend`: Elysia app — `/health`, `/api/v1/{scopes,skills,problems}` (200/400/404/500 TypeBox response schemas), Swagger, centralized `errorHandlerModule` + `notFound()` helper, `baseResponseSchema`/`errorResponseSchema`.

### 1.2 Not implemented (gaps vs v0.2 §77)
- `source_blocks` table — §77 requires a "block table"; only `source_documents` + `source_pages` exist.
- An extracted/staged questions table (Phase 1 output).
- Real PDF extraction (only `document_extract_stub`).
- `normalize_document`, `segment_questions`, `extract_answers` worker jobs.
- Document ingestion API (`POST /documents`, `POST /documents/:id/process`, `GET /documents/:id/questions` — v0.2 Appendix B).
- Deterministic validation rules for extracted questions.

---

## 2. Scope Cleanup — what leaves the ACTIVE plan

The v0.2 doc stays as long-horizon reference. This section stamps every section so the next epic only carries what is implemented or planned.

### 2.0 Storage Decision (local filesystem now, S3 later)
- Phase 1 stores uploaded PDFs on **local disk** under `./storage/pdfs/` (mounted volume in `docker-compose.yaml`).
- `sourceDocuments.storagePath` is a relative path string (e.g. `storage/pdfs/2026/09/08/uuid.pdf`).
- Design for future S3 migration: worker code reads from a single `getDocumentPath(storagePath)` helper, and the API layer abstracts upload. When scaling, swap the helper/upload target without touching worker logic or schema.

### 2.1 v0.2 § status map

| Status | Sections (v0.2.md) |
|---|---|
| **Implemented** | §5 Tech; §7.1 Base Entity; §8 Knowledge Nodes; §9 Knowledge Relations; §10 Skills; §11 Problems; §12 (partial) Solution Approaches; §32 Provenance; §34 Pipeline concept; §35 Ingestion stages 0–4 concepts; §37 (concept) confidence thresholds; §55 (partial) Worker Architecture; §76 Phase 0 |
| **Next Epic (Phase 1)** | §36 AI-as-enrichment boundary; §37 confidence thresholds (apply to QA); §55 worker jobs `extract_document/normalize_document/segment_questions/extract_answers`; §77 Phase 1; Appendix B ingest endpoints; Appendix C Phase-1 jobs |
| **Deferred** | §13 Problem Decomposition; §14 (rest) eval policies/item options/full 4-layer runtime; §15 calibrated difficulty; §16/17 mastery+forgetting algorithms; §18 Polya hints; §19 Learning Graph policies; §20–26 scope/exam/historical/experimental; §27/28/48 search & retrieval; §29/30 repo versioning; §30/31 issues/PR; §33 Annotation System; §36–40 AI cost/priority/incremental reprocessing; §41 AI-vs-human workflow; §42–54 sessions/adaptive/exams/recommendations; §50/51/52 relationships/rules/indexes; §53 repo-vs-runtime; §54 API direction (full list); §56–66 examples/plugins; §67–74 package responsibilities; §75 MVP philosophy; §78–115 Phases 2–8 + appendices A–F |

### 2.2 Appendix A tables — Implemented vs Deferred

Implemented (in `packages/db/src/schema/*`):
`users, sessions, accounts, verifications, repositories, repository_versions, scopes, skills, knowledge_nodes, knowledge_relations, problems, solution_approaches, assessments, assessment_items, attempts, item_results, skill_states, source_documents, source_pages, provenance, ai_artifacts, worker_jobs`.

Deferred (NOT created, NOT Phase 1):
`source_blocks` (NEW in Phase 1), `problem_skills`, `solution_steps` (kept as JSONB inside `solution_approaches`), `questions`, `problem_occurrences`, `exams`, `exam_questions`, `students` (use `users`), `hints`, `annotations`, `issues`, `pull_requests`.

> Note: `solution_steps` is intentionally modeled as a JSONB array on `solution_approaches.steps` (matches current schema line 32–38), not a separate table. Mark §50/52 accordingly.

### 2.3 Dead / legacy repo resources to remove (not used, not Phase 1)

**Tier 1 — remove immediately (no functional dependency, clearly stale):**
- `README.md` — says "comic-sharing"; rewrite for openlearning or delete.
- `deep-research-report.md` — Vietnamese research notes, not platform documentation.
- `.env.example` — stale (`k8s_dashboard`, comic-sharing vars); rewrite for `openlearning` (Postgres user/db, `DATABASE_URL`, `PORT`, `LOG_LEVEL`, worker vars).
- `backend/src/modules/example/` — throwaway demo route (`/example`).
- `backend/src/modules/error-example/` — throwaway demo route (`/error-example`).
- `backend/drizzle/20260509160434_low_sersi/` — legacy comic-sharing migration; `packages/db/drizzle` is the source of truth.
- `.lintstagedrc.js` — remove the commented-out `backend/src/database/schema` db:generate hook; align typecheck/lint to the workspaces packages.

**Tier 2 — remove after confirmation (Phase 1 does not need auth/UI; re-add in a later phase):**
- `backend/src/database/{schema,types.ts,speard.ts}` — legacy schema duplicates `packages/db`; only referenced by `profile` + `databaseModule`.
- `backend/src/modules/profile/` — depends on legacy `database/schema` + `better-auth`.
- `backend/src/utils/logger.ts` + `backend/src/commons/modules/logger.ts` — duplicate of `packages/config` logger; switch backend to `@openlearning/config` logger.
- `frontend/` — placeholder Next.js starter; `frontend/lib/api.ts` imports stale `@comic-sharing/backend`; not integrated with the learning API. Remove from repo + `docker-compose.yaml` unless a Phase-2 UI owner is staffed.
- Backend deps only for legacy: `better-auth`, `drizzle-typebox`, `@electric-sql/pglite`, `pino-pretty`.

**RISK:** Tier 2 removals drop auth/profiles/UI. The v1 API currently has **no auth** (routes are public), and Phase 1 is backend-ingestion-only, so this is safe for the next epic. Flag: do NOT remove `backend/src/modules/{scopes,skills,problems,health}` or `packages/*`/`apps/worker`.

---

## 3. Phase 1 — PDF → Question (next epic)

Goal (v0.2 §77): `PDF → pages → blocks → questions → answers → source provenance`. Deterministic first; no sophisticated AI.

### 3.1 Schema (`packages/db/src/schema/ingestion.ts`)
- [ ] Add `sourceBlocks` table: `id PK`, `documentId → sourceDocuments.id (FK cascade)`, `pageId → sourcePages.id (FK)`, `pageNumber`, `blockIndex` (order), `content` (text), `kind` (text/figure/table/equation), `bbox` (jsonb). Indexes on `(documentId)`, `(pageId)`, `(pageId, blockIndex)`.
- [ ] Add `extractedQuestions` staging table: `id PK`, `sourceDocumentId → sourceDocuments.id`, `pageStart`, `pageEnd`, `startBlockId → sourceBlocks.id`, `endBlockId`, `number` (string, e.g. "1"), `statement` (text), `options` (jsonb text[]), `answerKey` (jsonb), `confidence` (real 0..1), `status` (pending/review/stable), timestamps. Indexes on `(sourceDocumentId)`, `(status)`.

### 3.2 Migration
- [ ] `bun --cwd packages/db db:generate` → SQL migration in `packages/db/drizzle/`.
- [ ] `bun --cwd packages/db db:migrate` (or seed) against a local Postgres confirms clean apply.

### 3.3 Worker jobs (`apps/worker/src/handlers.ts`)
- [ ] Implement `extract_document`: deterministic PDF text extraction (e.g. `pdf-parse`) → populate `sourcePages` + `sourceBlocks` + `provenance` rows. Register in the jobs registry.
- [ ] Implement `segment_questions`: deterministic heuristics (numbering patterns `Question 1`, `(1)`, `1.`, option detection) over `sourceBlocks` → `extractedQuestions`.
- [ ] Implement `extract_answers`: pull answer key from known answer blocks / option mapping → `extractedQuestions.answerKey`.
- [ ] Implement `normalize_document`: whitespace/Unicode cleanup before segmentation.
- [ ] Wire a chain: enqueue `extract_document` → on completion enqueue `normalize_document` → `segment_questions` → `extract_answers` (or do all in one pass; decide + document in plan).

### 3.4 API (`backend/src/modules/documents/`)
- [ ] `POST /documents` — persist `sourceDocuments` row (filename/hash/size/mimeType/storagePath), enqueue `extract_document` job, return `{ id, jobId }`.
- [ ] `POST /documents/:id/process` — enqueue/requeue extraction (idempotent).
- [ ] `GET /documents/:id` — metadata + status.
- [ ] `GET /documents/:id/questions` — list `extractedQuestions` (filter `?status=`).
- [ ] Reuse `baseResponseSchema`/`errorResponseSchema`; add tests.

### 3.5 Deterministic validation
- [ ] Rule checks on `extractedQuestions`: non-empty `statement`; option count matches detected type; `answerKey` present; page/block spans valid. On failure → set `status='review'`, do NOT auto-promote. (AI enrichment is Phase 7.)

### 3.6 Seed + tests
- [ ] Extend `packages/db/src/seed.ts` with a representative `sourceDocument`/`sourcePages`/`sourceBlocks` (fixture text, no real PDF needed) for tests.
- [ ] Unit tests for segmentation rules (numbering/option heuristics).
- [ ] Worker integration test: enqueue `extract_document` with a fixture PDF path → assert `sourcePages`/`sourceBlocks`/`extractedQuestions` populated & job `completed`.

### 3.7 DX / infra
- [ ] Add `pdf-parse` (deterministic) to `apps/worker` deps. (OCR optional — only if scanned PDFs; defer tesseract/google vision.)
- [ ] `docker-compose.yaml`: ensure worker image has PDF deps if needed (pdf-parse is pure JS — none).
- [ ] Update `PROJECT_DESCRIPTION.md`, `changes.md`, `plan.md` checkboxes.

### Out of Phase 1
Solution→canonical Problem/Assessment (Phase 2), skill classification, search, student state, adaptive practice, exam generation, repository contributions, AI enrichment, frontend.

---

## 4. Validation gate (before closing Phase 1)
- [ ] `bun run typecheck` → 0 errors, 0 `any`.
- [ ] `bun test` (packages/config, packages/domain, packages/db, apps/worker, backend) → 100% pass.
- [ ] `GET /health` → 200; `POST /documents` → 201 + enqueued job; `GET /documents/:id/questions` → array.
- [ ] Worker processes `extract_document` end-to-end; `source_pages` + `source_blocks` + `extracted_questions` populated.
- [ ] `plan.md`, `changes.md`, `PROJECT_DESCRIPTION.md` updated.
