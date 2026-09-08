import { getEnv, logger } from "@openlearning/config";
import { WorkerQueueManager } from "./queue";

export { WorkerQueueManager } from "./queue";

export interface WorkerController {
	abort: () => void;
	workerId: string;
}

export async function startWorkerDaemon(options?: {
	signal?: AbortSignal;
	pollIntervalMs?: number;
}): Promise<WorkerController> {
	const env = getEnv();
	const pollInterval = options?.pollIntervalMs ?? env.WORKER_POLL_INTERVAL_MS;
	const workerQueue = new WorkerQueueManager();

	logger.info("⚙️ Starting OpenLearning Background Worker Daemon", {
		concurrency: env.WORKER_CONCURRENCY,
		pollIntervalMs: pollInterval,
	});

	const abortController = new AbortController();

	async function runLoop() {
		while (!abortController.signal.aborted) {
			try {
				const processed = await workerQueue.pollAndProcessNextJob();
				if (!processed) {
					await new Promise((resolve) => setTimeout(resolve, pollInterval));
				}
			} catch (err) {
				logger.error("❌ Worker daemon loop error", { error: String(err) });
				await new Promise((resolve) => setTimeout(resolve, 3000));
			}
		}
	}

	const loopPromise = runLoop();

	return {
		abort: () => abortController.abort(),
		get workerId() {
			return workerQueue.workerId;
		},
	};
}

if (import.meta.main) {
	startWorkerDaemon()
		.then((controller) => {
			process.on("SIGINT", () => controller.abort());
			process.on("SIGTERM", () => controller.abort());
		})
		.catch((err) => {
			logger.error("❌ Worker daemon failed to start", { error: String(err) });
			process.exit(1);
		});
}
