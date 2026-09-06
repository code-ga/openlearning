# Project Description

This is a monolithic repository containing a Next.js frontend and an ElysiaJS backend, using Drizzle ORM and Postgres database, orchestrated via Docker Compose.

## Project Structure
- `/frontend`: Next.js frontend application.
- `/backend`: ElysiaJS backend application.
- `/nginx`: NGINX configuration for reverse proxying requests.
- `docker-compose.yaml`: Docker compose configuration for running Postgres, backend, frontend, and nginx.

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
  - `src/env.ts`: Schema validation for environment variables using Zod (`DATABASE_URL`, `PORT`, `LOG_LEVEL`, `WORKER_CONCURRENCY`, `WORKER_POLL_INTERVAL_MS`).
  - `src/logger.ts`: Structured JSON logger class supporting log levels (`debug`, `info`, `warn`, `error`) and context payload formatting.
- **`packages/domain`**:
  - `src/base.ts`: Base `Entity` interface and `ID` type.
  - `src/scope.ts`: `KnowledgeScope` domain model.
  - `src/knowledge.ts`: `KnowledgeNode` and `KnowledgeRelation` domain models & kinds.
  - `src/skill.ts`: `Skill` domain model.
  - `src/problem.ts`: `Problem`, `SolutionApproach`, `SolutionStep` domain models.
  - `src/assessment.ts`: 4-layer assessment hierarchy (`Problem` → `Assessment` → `AssessmentItem` → `Attempt`).
  - `src/index.ts`: Re-exports domain entities and type guards (`isKnowledgeNode`, `isProblem`, `isAssessment`, `isSkill`).
- **`packages/db`**:
  - `src/schema/*`: Drizzle ORM PostgreSQL schemas (`users`, `repositories`, `scopes`, `skills`, `knowledge_nodes`, `problems`, `solution_approaches`, `assessments`, `source_documents`, `worker_jobs`).
  - `src/client.ts`: Drizzle client factory & pool management (`createDbClient`, `getPgPool`).
  - `src/seed.ts`: Database seeder script for baseline scopes, skills, nodes, and test problems.
- **`apps/worker`**:
  - `src/queue.ts`: `WorkerQueueManager` managing Postgres-backed job polling, state transitions (`pending` → `processing` → `completed` | `failed`), retries, and locks.
  - `src/handlers.ts`: Job handlers registry (`ping_job`, `document_extract_stub`).
  - `src/index.ts`: Background worker daemon process entrypoint.
- **`backend`**:
  - `src/modules/health`: `GET /health` system health endpoint.
  - `src/modules/scopes`: REST endpoints `GET /v1/scopes` & `GET /v1/scopes/:id`.
  - `src/modules/skills`: REST endpoints `GET /v1/skills` & `GET /v1/skills/:id`.
  - `src/modules/problems`: REST endpoints `GET /v1/problems`, `GET /v1/problems/:id`, `POST /v1/problems`.

### Feature Flows & Execution Pipeline
1. **API Handling**: Client HTTP requests arrive at Nginx (`:80`) → routed to Elysia API (`:3001`). Input validated using TypeBox schemas → DB query executed via `@openlearning/db` → standardized JSON response returned.
2. **Worker Processing**: Background tasks (document parsing, classification) are enqueued into `worker_jobs` DB table → `WorkerQueueManager` polls pending jobs, acquires DB lock, runs handler in `apps/worker/src/handlers.ts`, and updates status to `completed` or `failed`.
3. **Database Migrations & Seeding**: `bun db:generate` creates SQL migrations in `packages/db/drizzle`. `bun db:seed` inserts baseline scopes, skills, and test problems.

## Future Updates & Ideas
- Update environment variables configuration in frontend. Currently it seems to have remnants of Vite (`import.meta.env`) but uses Next.js (`process.env.NEXT_PUBLIC_...`).
- Verify if any WebSocket proxying needs adjustments for ElysiaJS or Next.js HMR.
- Verify Elysia backend correctly parses requests from the Nginx proxy if client IPs are needed.
- Implement Phase 1: PDF Extraction Pipeline (`extract_document`, `normalize_document`, `segment_questions`).

## Notes & Warnings
- When adding new services or changing ports, update Nginx configuration accordingly.
- Always use `bun.js` (`bun test`, `bun typecheck`, `bun dev`) for script execution across workspace packages.


