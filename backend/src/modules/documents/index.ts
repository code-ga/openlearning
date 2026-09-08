import { db, sourceDocuments, sourcePages, sourceBlocks, extractedQuestions, workerJobs } from "@openlearning/db";
import { eq, desc, and, type InferSelectModel } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { notFound } from "../../commons/modules/error-handler";
import { baseResponseSchema, errorResponseSchema } from "../../commons/types";
import { createId } from "@paralleldrive/cuid2";
import { WorkerQueueManager } from "@openlearning/worker";

const documentSchema = t.Object({
  id: t.String(),
  filename: t.String(),
  mimeType: t.String(),
  fileSize: t.Number(),
  storagePath: t.String(),
  checksum: t.Nullable(t.String()),
  status: t.String(),
  metadata: t.Nullable(t.Any()),
  createdAt: t.Any(),
  updatedAt: t.Any(),
});

const pageSchema = t.Object({
  id: t.String(),
  documentId: t.String(),
  pageNumber: t.Number(),
  width: t.Nullable(t.Number()),
  height: t.Nullable(t.Number()),
  content: t.Nullable(t.String()),
  createdAt: t.Any(),
});

const blockSchema = t.Object({
  id: t.String(),
  documentId: t.String(),
  pageId: t.String(),
  pageNumber: t.Number(),
  blockIndex: t.Number(),
  content: t.String(),
  kind: t.String(),
  bbox: t.Nullable(t.Any()),
  createdAt: t.Any(),
});

const questionSchema = t.Object({
  id: t.String(),
  sourceDocumentId: t.String(),
  pageStart: t.Number(),
  pageEnd: t.Number(),
  startBlockId: t.Nullable(t.String()),
  endBlockId: t.Nullable(t.String()),
  number: t.String(),
  statement: t.String(),
  options: t.Nullable(t.Any()),
  answerKey: t.Nullable(t.Any()),
  confidence: t.Number(),
  status: t.String(),
  createdAt: t.Any(),
  updatedAt: t.Any(),
});

const createDocumentBody = t.Object({
  filename: t.String(),
  mimeType: t.String({ default: "application/pdf" }),
  fileSize: t.Number(),
  storagePath: t.String(),
  checksum: t.Optional(t.String()),
  metadata: t.Optional(t.Any()),
});

const processDocumentBody = t.Object({
  force: t.Optional(t.Boolean({ default: false })),
});

export const documentsModule = new Elysia({ prefix: "/v1/documents" })
  .post(
    "/",
    async ({ body, set }) => {
      const documentId = `doc_${createId()}`;
      const jobQueue = new WorkerQueueManager();

      await db.insert(sourceDocuments).values({
        id: documentId,
        filename: body.filename,
        mimeType: body.mimeType,
        fileSize: body.fileSize,
        storagePath: body.storagePath,
        checksum: body.checksum,
        metadata: body.metadata,
        status: "pending",
      });

      const jobId = await jobQueue.enqueueJob("extract_document", { documentId });

      set.status = 201;
      return {
        success: true,
        message: "Document created and extraction job enqueued",
        data: { id: documentId, jobId },
        timestamp: Date.now(),
        status: 201,
      };
    },
    {
      body: createDocumentBody,
      response: {
        201: baseResponseSchema(t.Object({ id: t.String(), jobId: t.String() })),
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: ["Documents"],
        summary: "Create a new document and enqueue extraction",
      },
    }
  )
  .post(
    "/:id/process",
    async ({ params: { id }, body, set }) => {
      const doc = await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, id)).limit(1);
      if (!doc[0]) {
        set.status = 404;
        return notFound("Document");
      }

      if (doc[0].status === "processed" && !body.force) {
        return {
          success: true,
          message: "Document already processed",
          data: { id, status: doc[0].status },
          timestamp: Date.now(),
          status: 200,
        };
      }

      const jobQueue = new WorkerQueueManager();
      const jobId = await jobQueue.enqueueJob("extract_document", { documentId: id });

      await db.update(sourceDocuments)
        .set({ status: "pending", updatedAt: new Date() })
        .where(eq(sourceDocuments.id, id));

      set.status = 202;
      return {
        success: true,
        message: "Document processing job enqueued",
        data: { id, jobId },
        timestamp: Date.now(),
        status: 202,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      body: processDocumentBody,
      response: {
        200: baseResponseSchema(t.Object({ id: t.String(), jobId: t.String() })),
        202: baseResponseSchema(t.Object({ id: t.String(), jobId: t.String() })),
        404: errorResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: ["Documents"],
        summary: "Enqueue/requeue document processing",
      },
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const doc = await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, id)).limit(1);
      if (!doc[0]) {
        set.status = 404;
        return notFound("Document");
      }

      set.status = 200;
      return {
        success: true,
        message: "Document retrieved successfully",
        data: doc[0],
        timestamp: Date.now(),
        status: 200,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: baseResponseSchema(documentSchema),
        404: errorResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: ["Documents"],
        summary: "Get document metadata and status",
      },
    }
  )
  .get(
    "/:id/pages",
    async ({ params: { id }, set }) => {
      const doc = await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, id)).limit(1);
      if (!doc[0]) {
        set.status = 404;
        return notFound("Document");
      }

      const pages = await db.select().from(sourcePages).where(eq(sourcePages.documentId, id)).orderBy(sourcePages.pageNumber);

      set.status = 200;
      return {
        success: true,
        message: "Pages retrieved successfully",
        data: pages,
        timestamp: Date.now(),
        status: 200,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: baseResponseSchema(t.Array(pageSchema)),
        404: errorResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: ["Documents"],
        summary: "List document pages",
      },
    }
  )
  .get(
    "/:id/blocks",
    async ({ params: { id }, query, set }) => {
      const doc = await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, id)).limit(1);
      if (!doc[0]) {
        set.status = 404;
        return notFound("Document");
      }

      const pageNumber = query.page ? Number(query.page) : undefined;
      let blocks: InferSelectModel<typeof sourceBlocks>[];
      if (pageNumber) {
        blocks = await db.select().from(sourceBlocks)
          .where(and(eq(sourceBlocks.documentId, id), eq(sourceBlocks.pageNumber, pageNumber)))
          .orderBy(sourceBlocks.blockIndex);
      } else {
        blocks = await db.select().from(sourceBlocks)
          .where(eq(sourceBlocks.documentId, id))
          .orderBy(sourceBlocks.pageNumber, sourceBlocks.blockIndex);
      }

      set.status = 200;
      return {
        success: true,
        message: "Blocks retrieved successfully",
        data: blocks,
        timestamp: Date.now(),
        status: 200,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({ page: t.Optional(t.String()) }),
      response: {
        200: baseResponseSchema(t.Array(blockSchema)),
        404: errorResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: ["Documents"],
        summary: "List document blocks (optionally filtered by page)",
      },
    }
  )
  .get(
    "/:id/questions",
    async ({ params: { id }, query, set }) => {
      const doc = await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, id)).limit(1);
      if (!doc[0]) {
        set.status = 404;
        return notFound("Document");
      }

      const status = query.status as string | undefined;
      let questions: InferSelectModel<typeof extractedQuestions>[];
      if (status) {
        questions = await db.select().from(extractedQuestions)
          .where(and(eq(extractedQuestions.sourceDocumentId, id), eq(extractedQuestions.status, status)))
          .orderBy(extractedQuestions.number);
      } else {
        questions = await db.select().from(extractedQuestions)
          .where(eq(extractedQuestions.sourceDocumentId, id))
          .orderBy(extractedQuestions.number);
      }

      set.status = 200;
      return {
        success: true,
        message: "Questions retrieved successfully",
        data: questions,
        timestamp: Date.now(),
        status: 200,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({ status: t.Optional(t.String()) }),
      response: {
        200: baseResponseSchema(t.Array(questionSchema)),
        404: errorResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: ["Documents"],
        summary: "List extracted questions (filter by status: pending, review, stable)",
      },
    }
  )
  .get(
    "/:id/jobs",
    async ({ params: { id }, set }) => {
      const doc = await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, id)).limit(1);
      if (!doc[0]) {
        set.status = 404;
        return notFound("Document");
      }

      const jobs = await db.select().from(workerJobs)
        .where(eq(workerJobs.payload, { documentId: id }))
        .orderBy(desc(workerJobs.createdAt));

      set.status = 200;
      return {
        success: true,
        message: "Jobs retrieved successfully",
        data: jobs,
        timestamp: Date.now(),
        status: 200,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: baseResponseSchema(t.Array(t.Any())),
        404: errorResponseSchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
      detail: {
        tags: ["Documents"],
        summary: "List jobs for a document",
      },
    }
  );