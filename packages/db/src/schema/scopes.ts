import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const scopes = pgTable("scopes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  curriculum: text("curriculum"),
  educationLevel: text("education_level"),
  examType: text("exam_type"),
  region: text("region"),
  includedSkillIds: jsonb("included_skill_ids").$type<string[]>().default([]).notNull(),
  excludedSkillIds: jsonb("excluded_skill_ids").$type<string[]>().default([]).notNull(),
  parentScopeId: text("parent_scope_id"),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});
