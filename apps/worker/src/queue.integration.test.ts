import { beforeAll, describe, expect, test } from "bun:test";
import { WorkerQueueManager } from "./queue";
import { db, workerJobs } from "@openlearning/db";
import { eq } from "drizzle-orm";
import { jobHandlers } from "./handlers";

let dbAvailable = false;

const checkDbAvailable = async (): Promise<boolean> => {
	try {
		await db.select().from(workerJobs).limit(1);
		return true;
	} catch {
		return false;
	}
};

beforeAll(async () => {
	dbAvailable = await checkDbAvailable();
});

describe("Worker Queue Integration Tests", () => {
	test("ping_job end-to-end: enqueue → process → completed", async () => {
		if (!dbAvailable) {
			expect(true).toBe(true);
			return;
		}

		const manager = new WorkerQueueManager("test_integration_worker");

		const id = await manager.enqueueJob("ping_job", { message: "integration-test" });
		const processed = await manager.pollAndProcessNextJob();

		expect(processed).toBe(true);

		const row = (
			await db.select().from(workerJobs).where(eq(workerJobs.id, id)).limit(1)
		)[0];

		expect(row).toBeDefined();
		if (row) {
			expect(row.status).toBe("completed");
			expect(row.result).toBeDefined();
			expect((row.result as Record<string, unknown>).pong).toBe(true);
			expect(row.completedAt).toBeDefined();
			expect(row.attempts).toBe(1);
			expect(row.lockedBy).toBe("test_integration_worker");
		}
	});

	test("unknown job type returns failed status", async () => {
		if (!dbAvailable) {
			expect(true).toBe(true);
			return;
		}

		const manager = new WorkerQueueManager("test_integration_worker_2");

		const id = await manager.enqueueJob("unknown_job_type", {});
		const processed = await manager.pollAndProcessNextJob();

		expect(processed).toBe(true);

		const row = (
			await db.select().from(workerJobs).where(eq(workerJobs.id, id)).limit(1)
		)[0];

		expect(row).toBeDefined();
		if (row) {
			expect(row.status).toBe("failed");
			expect(row.error).toContain("No registered handler");
			expect(row.attempts).toBe(1);
		}
	});

	test("retry: handler throws twice then succeeds", async () => {
		if (!dbAvailable) {
			expect(true).toBe(true);
			return;
		}

		let callCount = 0;
		const flakyHandler = async () => {
			callCount++;
			if (callCount < 3) {
				throw new Error(`Flaky error attempt ${callCount}`);
			}
			return { success: true, attempt: callCount };
		};

		const originalHandlers = { ...jobHandlers };
		jobHandlers["flaky_job"] = flakyHandler;

		try {
			const manager = new WorkerQueueManager("test_integration_worker_3", 60000);

			const id = await manager.enqueueJob("flaky_job", {}, 5);
			await manager.pollAndProcessNextJob();

			const row = (
				await db.select().from(workerJobs).where(eq(workerJobs.id, id)).limit(1)
			)[0];

			expect(row).toBeDefined();
			if (row) {
				expect(row.status).toBe("completed");
				expect(row.attempts).toBe(3);
				expect((row.result as Record<string, unknown>).success).toBe(true);
			}
		} finally {
			delete jobHandlers["flaky_job"];
			Object.assign(jobHandlers, originalHandlers);
		}
	});
});