import { index, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const problems = pgTable(
  "problems",
  {
    id: text("id").primaryKey(),
    statement: text("statement").notNull(),
    assumptions: jsonb("assumptions").$type<string[]>(),
    goals: jsonb("goals").$type<string[]>(),
    skillIds: jsonb("skill_ids").$type<string[]>().default([]).notNull(),
    scopeIds: jsonb("scope_ids").$type<string[]>().default([]).notNull(),
    solutionApproachIds: jsonb("solution_approach_ids").$type<string[]>().default([]).notNull(),
    difficulty: jsonb("difficulty").$type<{
      estimatedLevel: number;
      confidence: number;
      calibrated: boolean;
    }>().default({ estimatedLevel: 1, confidence: 0.5, calibrated: false }).notNull(),
    sourceIds: jsonb("source_ids").$type<string[]>().default([]).notNull(),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("problems_status_idx").on(table.status)]
);

export const solutionApproaches = pgTable("solution_approaches", {
  id: text("id").primaryKey(),
  problemId: text("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  strategy: text("strategy").notNull(),
  steps: jsonb("steps").$type<Array<{
    order: number;
    description: string;
    inputKnowledgeIds?: string[];
    outputKnowledgeIds?: string[];
    skillIds?: string[];
  }>>().default([]).notNull(),
  requiredSkillIds: jsonb("required_skill_ids").$type<string[]>().default([]).notNull(),
  applicability: text("applicability"),
  pedagogicalProfile: jsonb("pedagogical_profile").$type<{
    algebraic?: boolean;
    geometric?: boolean;
    computational?: boolean;
    conceptual?: boolean;
  }>(),
  sourceIds: jsonb("source_ids").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
