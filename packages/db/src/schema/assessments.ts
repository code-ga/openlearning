import { index, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { problems } from "./problems";
import { users } from "./auth";

export const assessments = pgTable(
  "assessments",
  {
    id: text("id").primaryKey(),
    problemId: text("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // single_choice, multiple_choice, true_false, etc.
    title: text("title"),
    instructions: text("instructions"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("assessments_problem_idx").on(table.problemId)]
);

export const assessmentItems = pgTable("assessment_items", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  order: integer("order").default(0).notNull(),
  statement: text("statement").notNull(),
  answerKey: jsonb("answer_key").notNull(),
  skillIds: jsonb("skill_ids").$type<string[]>().default([]).notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attempts = pgTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
    studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    totalScore: real("total_score").default(0).notNull(),
    durationMs: integer("duration_ms"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("attempts_assessment_idx").on(table.assessmentId),
    index("attempts_student_idx").on(table.studentId),
  ]
);

export const itemResults = pgTable("item_results", {
  id: text("id").primaryKey(),
  attemptId: text("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => assessmentItems.id, { onDelete: "cascade" }),
  givenAnswer: jsonb("given_answer"),
  isCorrect: text("is_correct").notNull(), // "true" / "false"
  score: real("score").default(0).notNull(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skillStates = pgTable(
  "skill_states",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    skillId: text("skill_id").notNull(),
    masteryLevel: real("mastery_level").default(0.0).notNull(),
    confidence: real("confidence").default(0.5).notNull(),
    lastPracticedAt: timestamp("last_practiced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("skill_states_student_skill_idx").on(table.studentId, table.skillId)]
);
