import { index, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const knowledgeNodes = pgTable(
  "knowledge_nodes",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(), // concept, statement, definition, etc.
    title: text("title").notNull(),
    content: text("content").notNull(),
    scopeIds: jsonb("scope_ids").$type<string[]>().default([]).notNull(),
    sourceIds: jsonb("source_ids").$type<string[]>().default([]).notNull(),
    confidence: real("confidence").default(1.0),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("knowledge_nodes_kind_idx").on(table.kind),
    index("knowledge_nodes_status_idx").on(table.status),
  ]
);

export const knowledgeRelations = pgTable(
  "knowledge_relations",
  {
    id: text("id").primaryKey(),
    fromId: text("from_id").notNull().references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    toId: text("to_id").notNull().references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // depends_on, requires, supports, etc.
    confidence: real("confidence").default(1.0),
    sourceIds: jsonb("source_ids").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_relations_from_idx").on(table.fromId),
    index("knowledge_relations_to_idx").on(table.toId),
  ]
);
