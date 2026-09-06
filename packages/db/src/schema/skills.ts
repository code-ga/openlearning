import { index, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const skills = pgTable(
  "skills",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    parentSkillId: text("parent_skill_id"),
    scopeIds: jsonb("scope_ids").$type<string[]>().default([]).notNull(),
    difficulty: real("difficulty").default(1.0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("skills_code_idx").on(table.code)]
);
