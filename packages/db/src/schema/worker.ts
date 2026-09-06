import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const workerJobs = pgTable(
  "worker_jobs",
  {
    id: text("id").primaryKey(),
    jobType: text("job_type").notNull(), // extract_document, segment_questions, etc.
    status: text("status").default("pending").notNull(), // pending, processing, completed, failed
    payload: jsonb("payload").default({}).notNull(),
    result: jsonb("result"),
    error: text("error"),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(3).notNull(),
    lockedBy: text("locked_by"),
    lockedAt: timestamp("locked_at"),
    scheduledAt: timestamp("scheduled_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("worker_jobs_status_idx").on(table.status),
    index("worker_jobs_type_status_idx").on(table.jobType, table.status),
  ]
);
