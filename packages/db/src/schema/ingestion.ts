import { index, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const sourceDocuments = pgTable("source_documents", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").default("application/pdf").notNull(),
  fileSize: integer("file_size").notNull(),
  storagePath: text("storage_path").notNull(),
  checksum: text("checksum"),
  status: text("status").default("pending").notNull(),
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

export const sourceBlocks = pgTable(
  "source_blocks",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id").notNull().references(() => sourceDocuments.id, { onDelete: "cascade" }),
    pageId: text("page_id").notNull().references(() => sourcePages.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    blockIndex: integer("block_index").notNull(),
    content: text("content").notNull(),
    kind: text("kind").notNull(),
    bbox: jsonb("bbox"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("source_blocks_document_id_idx").on(table.documentId),
    index("source_blocks_page_id_idx").on(table.pageId),
    index("source_blocks_page_id_block_index_idx").on(table.pageId, table.blockIndex),
  ]
);

export const extractedQuestions = pgTable(
  "extracted_questions",
  {
    id: text("id").primaryKey(),
    sourceDocumentId: text("source_document_id").notNull().references(() => sourceDocuments.id, { onDelete: "cascade" }),
    pageStart: integer("page_start").notNull(),
    pageEnd: integer("page_end").notNull(),
    startBlockId: text("start_block_id").references(() => sourceBlocks.id),
    endBlockId: text("end_block_id").references(() => sourceBlocks.id),
    number: text("number").notNull(),
    statement: text("statement").notNull(),
    options: jsonb("options"),
    answerKey: jsonb("answer_key"),
    confidence: real("confidence").notNull(),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("extracted_questions_document_id_idx").on(table.sourceDocumentId),
    index("extracted_questions_status_idx").on(table.status),
  ]
);

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
  taskName: text("task_name").notNull(),
  promptVersion: text("prompt_version").notNull(),
  modelName: text("model_name").notNull(),
  inputHash: text("input_hash").notNull(),
  rawOutput: jsonb("raw_output").notNull(),
  costUsd: text("cost_usd"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
