import { getEnv, logger } from "@openlearning/config";
import { WorkerQueueManager } from "./queue";

async function startWorkerDaemon() {
  const env = getEnv();
  logger.info("⚙️ Starting OpenLearning Background Worker Daemon", {
    concurrency: env.WORKER_CONCURRENCY,
    pollIntervalMs: env.WORKER_POLL_INTERVAL_MS,
  });

  const workerQueue = new WorkerQueueManager();

  while (true) {
    try {
      const processed = await workerQueue.pollAndProcessNextJob();
      if (!processed) {
        // Sleep for poll interval if no jobs processed
        await new Promise((resolve) => setTimeout(resolve, env.WORKER_POLL_INTERVAL_MS));
      }
    } catch (err) {
      logger.error("❌ Worker daemon loop error", { error: String(err) });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

if (import.meta.main) {
  startWorkerDaemon();
}
