import { db, workerJobs } from "@openlearning/db";
import { eq, and, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { logger } from "@openlearning/config";
import { jobHandlers } from "./handlers";

export class WorkerQueueManager {
  private workerId: string;

  constructor(workerId: string = `worker_${createId()}`) {
    this.workerId = workerId;
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

  public async pollAndProcessNextJob(): Promise<boolean> {
    // 1. Fetch next pending job
    const pendingJobs = await db
      .select()
      .from(workerJobs)
      .where(and(eq(workerJobs.status, "pending")))
      .limit(1);

    const job = pendingJobs[0];
    if (!job) {
      return false; // No pending job found
    }

    // 2. Lock job
    await db
      .update(workerJobs)
      .set({
        status: "processing",
        lockedBy: this.workerId,
        lockedAt: new Date(),
        attempts: job.attempts + 1,
        updatedAt: new Date(),
      })
      .where(eq(workerJobs.id, job.id));

    logger.info("🔒 Worker job locked for processing", { id: job.id, jobType: job.jobType });

    // 3. Execute handler
    const handler = jobHandlers[job.jobType];
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
        .where(eq(workerJobs.id, job.id));
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
        .where(eq(workerJobs.id, job.id));

      logger.info("✅ Worker job completed", { id: job.id, jobType: job.jobType });
      return true;
    } catch (err) {
      const errorStr = String(err);
      const isFinalAttempt = job.attempts + 1 >= job.maxAttempts;
      const nextStatus = isFinalAttempt ? "failed" : "pending";

      await db
        .update(workerJobs)
        .set({
          status: nextStatus,
          error: errorStr,
          updatedAt: new Date(),
        })
        .where(eq(workerJobs.id, job.id));

      logger.error("⚠️ Worker job processing error", { id: job.id, error: errorStr, nextStatus });
      return true;
    }
  }
}
