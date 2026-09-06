import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const sourceDocuments = pgTable("source_documents", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").default("application/pdf").notNull(),
  fileSize: integer("file_size").notNull(),
  storagePath: text("storage_path").notNull(),
  checksum: text("checksum"),
  status: text("status").default("pending").notNull(), // pending, extracted, processed, error
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sourcePages = pgTable("source_pages", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => sourceDocuments.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  width: integer("width"),
  height: integer("height"),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const provenance = pgTable("provenance", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  sourceDocumentId: text("source_document_id").references(() => sourceDocuments.id),
  pageNumber: integer("page_number"),
  extractorPipeline: text("extractor_pipeline"),
  confidenceScore: text("confidence_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiArtifacts = pgTable("ai_artifacts", {
  id: text("id").primaryKey(),
  taskName: text("task_name").notNull(), // skill_classification, hint_generation, etc.
  promptVersion: text("prompt_version").notNull(),
  modelName: text("model_name").notNull(),
  inputHash: text("input_hash").notNull(),
  rawOutput: jsonb("raw_output").notNull(),
  costUsd: text("cost_usd"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
