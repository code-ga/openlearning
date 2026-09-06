CREATE TABLE "accounts" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"token" text NOT NULL UNIQUE,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"is_public" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "repository_versions" (
	"id" text PRIMARY KEY,
	"repository_id" text NOT NULL,
	"version_tag" text NOT NULL,
	"changelog" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scopes" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"curriculum" text,
	"education_level" text,
	"exam_type" text,
	"region" text,
	"included_skill_ids" jsonb DEFAULT '[]' NOT NULL,
	"excluded_skill_ids" jsonb DEFAULT '[]' NOT NULL,
	"parent_scope_id" text,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"parent_skill_id" text,
	"scope_ids" jsonb DEFAULT '[]' NOT NULL,
	"difficulty" real DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "knowledge_nodes" (
	"id" text PRIMARY KEY,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"scope_ids" jsonb DEFAULT '[]' NOT NULL,
	"source_ids" jsonb DEFAULT '[]' NOT NULL,
	"confidence" real DEFAULT 1,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "knowledge_relations" (
	"id" text PRIMARY KEY,
	"from_id" text NOT NULL,
	"to_id" text NOT NULL,
	"type" text NOT NULL,
	"confidence" real DEFAULT 1,
	"source_ids" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" text PRIMARY KEY,
	"statement" text NOT NULL,
	"assumptions" jsonb,
	"goals" jsonb,
	"skill_ids" jsonb DEFAULT '[]' NOT NULL,
	"scope_ids" jsonb DEFAULT '[]' NOT NULL,
	"solution_approach_ids" jsonb DEFAULT '[]' NOT NULL,
	"difficulty" jsonb DEFAULT '{"estimatedLevel":1,"confidence":0.5,"calibrated":false}' NOT NULL,
	"source_ids" jsonb DEFAULT '[]' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "solution_approaches" (
	"id" text PRIMARY KEY,
	"problem_id" text NOT NULL,
	"title" text NOT NULL,
	"strategy" text NOT NULL,
	"steps" jsonb DEFAULT '[]' NOT NULL,
	"required_skill_ids" jsonb DEFAULT '[]' NOT NULL,
	"applicability" text,
	"pedagogical_profile" jsonb,
	"source_ids" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_items" (
	"id" text PRIMARY KEY,
	"assessment_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"statement" text NOT NULL,
	"answer_key" jsonb NOT NULL,
	"skill_ids" jsonb DEFAULT '[]' NOT NULL,
	"explanation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" text PRIMARY KEY,
	"problem_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" text PRIMARY KEY,
	"assessment_id" text NOT NULL,
	"student_id" text NOT NULL,
	"total_score" real DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_results" (
	"id" text PRIMARY KEY,
	"attempt_id" text NOT NULL,
	"item_id" text NOT NULL,
	"given_answer" jsonb,
	"is_correct" text NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_states" (
	"id" text PRIMARY KEY,
	"student_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"mastery_level" real DEFAULT 0 NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"last_practiced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_artifacts" (
	"id" text PRIMARY KEY,
	"task_name" text NOT NULL,
	"prompt_version" text NOT NULL,
	"model_name" text NOT NULL,
	"input_hash" text NOT NULL,
	"raw_output" jsonb NOT NULL,
	"cost_usd" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provenance" (
	"id" text PRIMARY KEY,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"source_document_id" text,
	"page_number" integer,
	"extractor_pipeline" text,
	"confidence_score" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_documents" (
	"id" text PRIMARY KEY,
	"filename" text NOT NULL,
	"mime_type" text DEFAULT 'application/pdf' NOT NULL,
	"file_size" integer NOT NULL,
	"storage_path" text NOT NULL,
	"checksum" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_pages" (
	"id" text PRIMARY KEY,
	"document_id" text NOT NULL,
	"page_number" integer NOT NULL,
	"width" integer,
	"height" integer,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_jobs" (
	"id" text PRIMARY KEY,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"result" jsonb,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"locked_by" text,
	"locked_at" timestamp,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");--> statement-breakpoint
CREATE INDEX "skills_code_idx" ON "skills" ("code");--> statement-breakpoint
CREATE INDEX "knowledge_nodes_kind_idx" ON "knowledge_nodes" ("kind");--> statement-breakpoint
CREATE INDEX "knowledge_nodes_status_idx" ON "knowledge_nodes" ("status");--> statement-breakpoint
CREATE INDEX "knowledge_relations_from_idx" ON "knowledge_relations" ("from_id");--> statement-breakpoint
CREATE INDEX "knowledge_relations_to_idx" ON "knowledge_relations" ("to_id");--> statement-breakpoint
CREATE INDEX "problems_status_idx" ON "problems" ("status");--> statement-breakpoint
CREATE INDEX "assessments_problem_idx" ON "assessments" ("problem_id");--> statement-breakpoint
CREATE INDEX "attempts_assessment_idx" ON "attempts" ("assessment_id");--> statement-breakpoint
CREATE INDEX "attempts_student_idx" ON "attempts" ("student_id");--> statement-breakpoint
CREATE INDEX "skill_states_student_skill_idx" ON "skill_states" ("student_id","skill_id");--> statement-breakpoint
CREATE INDEX "worker_jobs_status_idx" ON "worker_jobs" ("status");--> statement-breakpoint
CREATE INDEX "worker_jobs_type_status_idx" ON "worker_jobs" ("job_type","status");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "repository_versions" ADD CONSTRAINT "repository_versions_repository_id_repositories_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knowledge_relations" ADD CONSTRAINT "knowledge_relations_from_id_knowledge_nodes_id_fkey" FOREIGN KEY ("from_id") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knowledge_relations" ADD CONSTRAINT "knowledge_relations_to_id_knowledge_nodes_id_fkey" FOREIGN KEY ("to_id") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "solution_approaches" ADD CONSTRAINT "solution_approaches_problem_id_problems_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_assessment_id_assessments_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_problem_id_problems_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_assessment_id_assessments_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "item_results" ADD CONSTRAINT "item_results_attempt_id_attempts_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "item_results" ADD CONSTRAINT "item_results_item_id_assessment_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "assessment_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "skill_states" ADD CONSTRAINT "skill_states_student_id_users_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "provenance" ADD CONSTRAINT "provenance_source_document_id_source_documents_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "source_documents"("id");--> statement-breakpoint
ALTER TABLE "source_pages" ADD CONSTRAINT "source_pages_document_id_source_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "source_documents"("id") ON DELETE CASCADE;