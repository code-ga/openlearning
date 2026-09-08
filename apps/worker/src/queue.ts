import { db, workerJobs } from "@openlearning/db";
import { and, eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { getEnv, logger } from "@openlearning/config";
import { jobHandlers } from "./handlers";

export class WorkerQueueManager {
  public workerId: string;
  private lockTimeoutMs: number;

  constructor(workerId: string = `worker_${createId()}`, lockTimeoutMs?: number) {
    this.workerId = workerId;
    const env = getEnv();
    this.lockTimeoutMs = lockTimeoutMs ?? env.WORKER_LOCK_TIMEOUT_MS;
  }

  public async enqueueJob(
    jobType: string,
    payload: Record<string, unknown> = {},
    maxAttempts: number = 3
  ): Promise<string> {
    const id = `job_${createId()}`;
    await db.insert(workerJobs).values({
      id,
      jobType,
      status: "pending",
      payload,
      maxAttempts,
    });
    logger.info("📥 Worker job enqueued", { id, jobType });
    return id;
  }

  public async reclaimStuckJobs(): Promise<number> {
    const result = await db
      .update(workerJobs)
      .set({
        status: "pending",
        lockedBy: null,
        lockedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workerJobs.status, "processing"),
          sql`${workerJobs.lockedAt} < now() - interval '${this.lockTimeoutMs / 1000} seconds'`
        )
      );

    return result.rowCount ?? 0;
  }

  public async pollAndProcessNextJob(): Promise<boolean> {
    // 1. Atomic claim: SELECT ... FOR UPDATE SKIP LOCKED then UPDATE in one statement
    const claimedJob = await db
      .execute(
        sql`
          UPDATE ${workerJobs}
             SET status = 'processing',
                 locked_by = ${this.workerId},
                 locked_at = now(),
                 attempts = ${workerJobs.attempts} + 1,
                 updated_at = now()
           WHERE id = (
             SELECT id FROM ${workerJobs}
              WHERE status = 'pending'
                AND (locked_at IS NULL OR locked_at < now() - interval '${this.lockTimeoutMs / 1000} seconds')
              ORDER BY created_at ASC
              FOR UPDATE SKIP LOCKED
              LIMIT 1
           )
           RETURNING *
        `
      );

    const rows = claimedJob.rows;
    if (!rows || rows.length === 0) {
      return false; // No pending job found
    }

    const job = rows[0] as Record<string, unknown>;

    logger.info("🔒 Worker job locked for processing", { id: job.id, jobType: job.jobType });

    // 2. Execute handler
    const handler = jobHandlers[job.jobType as string];
    if (!handler) {
      const errorMsg = `No registered handler for job type '${job.jobType}'`;
      logger.error("❌ Worker job failed", { id: job.id, error: errorMsg });
      await db
        .update(workerJobs)
        .set({
          status: "failed",
          error: errorMsg,
          updatedAt: new Date(),
        })
        .where(eq(workerJobs.id, job.id as string));
      return true;
    }

    try {
      const result = await handler(job.payload as Record<string, unknown>);
      await db
        .update(workerJobs)
        .set({
          status: "completed",
          result,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(workerJobs.id, job.id as string));

      logger.info("✅ Worker job completed", { id: job.id, jobType: job.jobType });
      return true;
    } catch (err) {
      const errorStr = String(err);
      const currentAttempts = (job.attempts as number) ?? 0;
      const isFinalAttempt = currentAttempts + 1 >= (job.maxAttempts as number);
      const nextStatus = isFinalAttempt ? "failed" : "pending";

      await db
        .update(workerJobs)
        .set({
          status: nextStatus,
          error: errorStr,
          updatedAt: new Date(),
        })
        .where(eq(workerJobs.id, job.id as string));

      logger.error("⚠️ Worker job processing error", { id: job.id, error: errorStr, nextStatus });
      return true;
    }
  }
}
