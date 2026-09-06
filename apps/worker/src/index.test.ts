import { describe, expect, test } from "bun:test";
import { WorkerQueueManager } from "./queue";
import { jobHandlers } from "./handlers";

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
});
