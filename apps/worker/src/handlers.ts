import { logger } from "@openlearning/config";

export type JobHandler = (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;

export const jobHandlers: Record<string, JobHandler> = {
  ping_job: async (payload: Record<string, unknown>) => {
    logger.info("🏓 Executing ping_job handler", { payload });
    return {
      pong: true,
      receivedMessage: payload.message || "ping",
      processedAt: new Date().toISOString(),
    };
  },
  document_extract_stub: async (payload: Record<string, unknown>) => {
    logger.info("📄 Executing document_extract_stub handler", { payload });
    const documentId = String(payload.documentId || "unknown");
    return {
      documentId,
      status: "extracted_stub",
      extractedPagesCount: 0,
      timestamp: new Date().toISOString(),
    };
  },
};
