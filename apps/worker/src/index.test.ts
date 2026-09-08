import { describe, expect, test } from "bun:test";
import { WorkerQueueManager } from "./queue";
import { jobHandlers } from "./handlers";
import { startWorkerDaemon } from "./index";

describe("Worker Package Tests", () => {
	test("registers ping_job and document_extract_stub handlers", () => {
		expect(jobHandlers["ping_job"]).toBeDefined();
		expect(jobHandlers["document_extract_stub"]).toBeDefined();
	});

	test("ping_job handler returns expected result object", async () => {
		const handler = jobHandlers["ping_job"];
		const result = await handler!({ message: "Test Ping" });

		expect(result.pong).toBe(true);
		expect(result.receivedMessage).toBe("Test Ping");
		expect(result.processedAt).toBeDefined();
	});

	test("document_extract_stub handler returns stub output", async () => {
		const handler = jobHandlers["document_extract_stub"];
		const result = await handler!({ documentId: "doc_abc123" });

		expect(result.documentId).toBe("doc_abc123");
		expect(result.status).toBe("extracted_stub");
	});

	test("WorkerQueueManager instantiates without error", () => {
		const manager = new WorkerQueueManager("test_worker_1");
		expect(manager).toBeDefined();
	});

	test("daemon smoke test: start, enqueue ping_job, process, abort", async () => {
		const { db, workerJobs } = await import("@openlearning/db");
		const { eq } = await import("drizzle-orm");

		let dbAvailable = false;
		try {
			await db.select().from(workerJobs).limit(1);
			dbAvailable = true;
		} catch {
			// no db available
		}

		if (!dbAvailable) {
			expect(true).toBe(true);
			return;
		}

		const controller = await startWorkerDaemon({ pollIntervalMs: 500 });
		const manager = new WorkerQueueManager(controller.workerId);

		const id = await manager.enqueueJob("ping_job", { message: "daemon-test" });

		const startTime = Date.now();
		while (Date.now() - startTime < 10000) {
			const row = (
				await db.select().from(workerJobs).where(eq(workerJobs.id, id)).limit(1)
			)[0];
			if (row && row.status === "completed") {
				expect((row.result as Record<string, unknown>).pong).toBe(true);
				expect(row.attempts).toBe(1);
				controller.abort();
				return;
			}
			await new Promise((resolve) => setTimeout(resolve, 200));
		}

	controller.abort();
	throw new Error("Daemon did not complete job within 10s");
	});
});
