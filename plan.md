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

- [/] **Epic 4: Backend API Framework (`apps/api`)**
  - [/] **Step 4.1: Framework, Middleware & Swagger Setup**
    - [ ] Task 4.1.1: Wire global error handler middleware, CORS, and Swagger UI (`/swagger`).
    - [ ] Task 4.1.2: Implement system health check endpoint (`GET /health`).
    - [ ] *Verification*: `GET /health` returns 200 OK and `/swagger` loads.
  - [ ] **Step 4.2: Foundation Domain REST Endpoints**
    - [ ] Task 4.2.1: Implement `/api/v1/scopes` endpoints.
    - [ ] Task 4.2.2: Implement `/api/v1/skills` endpoints.
    - [ ] Task 4.2.3: Implement `/api/v1/problems` endpoints.
    - [ ] Task 4.2.4: Standardize response schemas (200, 400, 404, 500).
    - [ ] *Verification*: API endpoints return standard response shapes.
  - [ ] **Step 4.3: API Integration Tests**
    - [ ] Task 4.3.1: Write integration tests using Elysia `app.handle` and `bun test`.
    - [ ] *Verification*: `bun test apps/api` passes.

- [ ] **Epic 5: Background Worker Engine (`apps/worker`)**
  - [ ] **Step 5.1: Worker Execution Architecture & Queue Processor**
    - [ ] Task 5.1.1: Implement Postgres-backed `WorkerQueueManager` handling job polling, locks, timeouts, and state machine transitions.
    - [ ] Task 5.1.2: Define standard `WorkerJob` interface and registry.
    - [ ] *Verification*: Unit tests verifying worker locking and queue transitions.
  - [ ] **Step 5.2: Phase 0 Demo Worker Job & Worker Entrypoint**
    - [ ] Task 5.2.1: Implement `ping_job` and document processing stub handler.
    - [ ] Task 5.2.2: Wire `apps/worker/src/index.ts` daemon process.
    - [ ] Task 5.2.3: Write worker integration tests for job enqueueing and processing.
    - [ ] *Verification*: `bun test apps/worker` passes.

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
