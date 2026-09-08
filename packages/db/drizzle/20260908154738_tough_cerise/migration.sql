CREATE TABLE "extracted_questions" (
	"id" text PRIMARY KEY,
	"source_document_id" text NOT NULL,
	"page_start" integer NOT NULL,
	"page_end" integer NOT NULL,
	"start_block_id" text,
	"end_block_id" text,
	"number" text NOT NULL,
	"statement" text NOT NULL,
	"options" jsonb,
	"answer_key" jsonb,
	"confidence" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_blocks" (
	"id" text PRIMARY KEY,
	"document_id" text NOT NULL,
	"page_id" text NOT NULL,
	"page_number" integer NOT NULL,
	"block_index" integer NOT NULL,
	"content" text NOT NULL,
	"kind" text NOT NULL,
	"bbox" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "extracted_questions_document_id_idx" ON "extracted_questions" ("source_document_id");--> statement-breakpoint
CREATE INDEX "extracted_questions_status_idx" ON "extracted_questions" ("status");--> statement-breakpoint
CREATE INDEX "source_blocks_document_id_idx" ON "source_blocks" ("document_id");--> statement-breakpoint
CREATE INDEX "source_blocks_page_id_idx" ON "source_blocks" ("page_id");--> statement-breakpoint
CREATE INDEX "source_blocks_page_id_block_index_idx" ON "source_blocks" ("page_id","block_index");--> statement-breakpoint
ALTER TABLE "extracted_questions" ADD CONSTRAINT "extracted_questions_source_document_id_source_documents_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "source_documents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "extracted_questions" ADD CONSTRAINT "extracted_questions_start_block_id_source_blocks_id_fkey" FOREIGN KEY ("start_block_id") REFERENCES "source_blocks"("id");--> statement-breakpoint
ALTER TABLE "extracted_questions" ADD CONSTRAINT "extracted_questions_end_block_id_source_blocks_id_fkey" FOREIGN KEY ("end_block_id") REFERENCES "source_blocks"("id");--> statement-breakpoint
ALTER TABLE "source_blocks" ADD CONSTRAINT "source_blocks_document_id_source_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "source_documents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "source_blocks" ADD CONSTRAINT "source_blocks_page_id_source_pages_id_fkey" FOREIGN KEY ("page_id") REFERENCES "source_pages"("id") ON DELETE CASCADE;