import { db, sourceDocuments, sourcePages, sourceBlocks, provenance, extractedQuestions } from "@openlearning/db";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { getEnv, logger } from "@openlearning/config";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export type JobHandler = (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;

export function getStoragePath(storagePath: string): string {
  const env = getEnv();
  const basePath = process.cwd();
  return `${basePath}/${storagePath}`;
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, " ")
    .replace(/[ \u2000-\u200B]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function detectBlockKind(text: string): "text" | "figure" | "table" | "equation" {
  const trimmed = text.trim();
  if (trimmed.startsWith("Figure") || trimmed.startsWith("Fig.") || /\[image\]/i.test(trimmed)) {
    return "figure";
  }
  if (trimmed.startsWith("Table") || /^\|.*\|$/m.test(trimmed)) {
    return "table";
  }
  if (/\\\(|\\\)|\\\[|\\\]|\$\$|\$/.test(trimmed)) {
    return "equation";
  }
  return "text";
}

export function splitIntoBlocks(pageContent: string): string[] {
  const paragraphs = pageContent.split("\n\n").map(p => p.trim()).filter(p => p.length > 0);
  return paragraphs.length > 0 ? paragraphs : [pageContent.trim()];
}

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

  extract_document: async (payload: Record<string, unknown>) => {
    const documentId = String(payload.documentId);
    if (!documentId) {
      throw new Error("documentId is required");
    }

    logger.info("📄 Starting extract_document", { documentId });

    const doc = await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, documentId)).limit(1);
    if (!doc[0]) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const document = doc[0];
    const filePath = getStoragePath(document.storagePath);

    logger.info("📄 Reading PDF file", { filePath });

    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfData = await pdfParse(buffer);

    logger.info("📄 PDF parsed", { numPages: pdfData.numpages, textLength: pdfData.text.length });

    await db.update(sourceDocuments)
      .set({ status: "extracted", updatedAt: new Date() })
      .where(eq(sourceDocuments.id, documentId));

    const pagePromises = [];
    for (let i = 0; i < pdfData.numpages; i++) {
      const pageNumber = i + 1;
      const pageText = pdfData.text.split("\n\n")[i] || "";
      const normalizedText = normalizeText(pageText);
      const blocks = splitIntoBlocks(normalizedText);

      const pageId = `page_${createId()}`;
      pagePromises.push(
        db.insert(sourcePages).values({
          id: pageId,
          documentId,
          pageNumber,
          content: normalizedText,
        } as typeof sourcePages.$inferInsert)
      );

      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        const blockContent = blocks[blockIndex]!;
        const blockId = `block_${createId()}`;
        const kind = detectBlockKind(blockContent);

        pagePromises.push(
          db.insert(sourceBlocks).values({
            id: blockId,
            documentId,
            pageId,
            pageNumber,
            blockIndex,
            content: blockContent,
            kind,
            bbox: null,
          } as typeof sourceBlocks.$inferInsert)
        );

        pagePromises.push(
          db.insert(provenance).values({
            id: `prov_${createId()}`,
            entityType: "source_block",
            entityId: blockId,
            sourceDocumentId: documentId,
            pageNumber,
            extractorPipeline: "pdf-parse:v1",
            confidenceScore: "1.0",
          } as typeof provenance.$inferInsert)
        );
      }

      pagePromises.push(
        db.insert(provenance).values({
          id: `prov_${createId()}`,
          entityType: "source_page",
          entityId: pageId,
          sourceDocumentId: documentId,
          pageNumber,
          extractorPipeline: "pdf-parse:v1",
          confidenceScore: "1.0",
        } as typeof provenance.$inferInsert)
      );
    }

    await Promise.all(pagePromises);

    logger.info("✅ extract_document completed", { documentId, pages: pdfData.numpages });

    return {
      documentId,
      status: "extracted",
      extractedPagesCount: pdfData.numpages,
      timestamp: new Date().toISOString(),
    };
  },

  normalize_document: async (payload: Record<string, unknown>) => {
    const documentId = String(payload.documentId);
    if (!documentId) {
      throw new Error("documentId is required");
    }

    logger.info("🔧 Starting normalize_document", { documentId });

    const blocks = await db.select().from(sourceBlocks).where(eq(sourceBlocks.documentId, documentId));
    
    let normalizedCount = 0;
    for (const block of blocks) {
      const normalized = normalizeText(block.content);
      if (normalized !== block.content) {
        await db.update(sourceBlocks)
          .set({ content: normalized })
          .where(eq(sourceBlocks.id, block.id));
        normalizedCount++;
      }
    }

    const pages = await db.select().from(sourcePages).where(eq(sourcePages.documentId, documentId));
    for (const page of pages) {
      if (page.content) {
        const normalized = normalizeText(page.content);
        if (normalized !== page.content) {
          await db.update(sourcePages)
            .set({ content: normalized })
            .where(eq(sourcePages.id, page.id));
        }
      }
    }

    logger.info("✅ normalize_document completed", { documentId, normalizedBlocks: normalizedCount });

    return {
      documentId,
      status: "normalized",
      normalizedBlocksCount: normalizedCount,
      timestamp: new Date().toISOString(),
    };
  },

  segment_questions: async (payload: Record<string, unknown>) => {
    const documentId = String(payload.documentId);
    if (!documentId) {
      throw new Error("documentId is required");
    }

    logger.info("❓ Starting segment_questions", { documentId });

    const blocks = await db.select().from(sourceBlocks)
      .where(eq(sourceBlocks.documentId, documentId))
      .orderBy(sourceBlocks.pageNumber, sourceBlocks.blockIndex);

    if (blocks.length === 0) {
      throw new Error(`No blocks found for document: ${documentId}`);
    }

    const questionPattern = /^(?:Question\s+|Q\s*\.?\s*)?(\d+)[\.\)]\s*(.+)$/i;
    const optionPattern = /^[A-Da-d][\.\)]\s*(.+)$/;

    const questions: Array<{
      number: string;
      statement: string;
      options: string[];
      startBlockIndex: number;
      endBlockIndex: number;
      pageStart: number;
      pageEnd: number;
      startBlockId: string;
      endBlockId: string;
    }> = [];

    let currentQuestion: typeof questions[0] | null = null;
    let inOptions = false;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]!;
      const text = block.content.trim();

      const questionMatch = text.match(questionPattern);
      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          number: questionMatch[1]!,
          statement: questionMatch[2]!.trim(),
          options: [],
          startBlockIndex: i,
          endBlockIndex: i,
          pageStart: block.pageNumber,
          pageEnd: block.pageNumber,
          startBlockId: block.id,
          endBlockId: block.id,
        };
        inOptions = false;
        continue;
      }

      if (currentQuestion && !inOptions) {
        const optionMatch = text.match(optionPattern);
        if (optionMatch) {
          inOptions = true;
          currentQuestion.options.push(optionMatch[1]!.trim());
          currentQuestion.endBlockIndex = i;
          currentQuestion.endBlockId = block.id;
          currentQuestion.pageEnd = block.pageNumber;
          continue;
        }
        if (currentQuestion.statement.length < 200) {
          currentQuestion.statement += " " + text;
          currentQuestion.endBlockIndex = i;
          currentQuestion.endBlockId = block.id;
          currentQuestion.pageEnd = block.pageNumber;
        }
      } else if (currentQuestion && inOptions) {
        const optionMatch = text.match(optionPattern);
        if (optionMatch) {
          currentQuestion.options.push(optionMatch[1]!.trim());
          currentQuestion.endBlockIndex = i;
          currentQuestion.endBlockId = block.id;
          currentQuestion.pageEnd = block.pageNumber;
        } else {
          inOptions = false;
        }
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    logger.info("❓ Questions detected", { documentId, count: questions.length });

    let createdCount = 0;
    for (const q of questions) {
      const confidence = q.options.length > 0 ? 0.85 : 0.6;
      await db.insert(extractedQuestions).values({
        id: `eq_${createId()}`,
        sourceDocumentId: documentId,
        pageStart: q.pageStart,
        pageEnd: q.pageEnd,
        startBlockId: q.startBlockId,
        endBlockId: q.endBlockId,
        number: q.number,
        statement: q.statement,
        options: q.options.length > 0 ? q.options : null,
        answerKey: null,
        confidence,
        status: q.options.length > 0 && q.statement.length > 10 ? "pending" : "review",
      } as typeof extractedQuestions.$inferInsert);
      createdCount++;
    }

    await db.update(sourceDocuments)
      .set({ status: "processed", updatedAt: new Date() })
      .where(eq(sourceDocuments.id, documentId));

    logger.info("✅ segment_questions completed", { documentId, createdCount });

    return {
      documentId,
      status: "segmented",
      questionsFound: createdCount,
      timestamp: new Date().toISOString(),
    };
  },

  extract_answers: async (payload: Record<string, unknown>) => {
    const documentId = String(payload.documentId);
    if (!documentId) {
      throw new Error("documentId is required");
    }

    logger.info("🔑 Starting extract_answers", { documentId });

    const questions = await db.select().from(extractedQuestions)
      .where(and(eq(extractedQuestions.sourceDocumentId, documentId), eq(extractedQuestions.status, "pending")));

    const blocks = await db.select().from(sourceBlocks)
      .where(eq(sourceBlocks.documentId, documentId))
      .orderBy(sourceBlocks.pageNumber, sourceBlocks.blockIndex);

    const answerKeyPattern = /^(?:Answer|Ans|Key)\s*[:\-]?\s*([A-Da-d])/i;
    const answerLinePattern = /^(\d+)\s*[:\.]\s*([A-Da-d])/;

    let answerMap: Record<string, string> = {};

    for (const block of blocks) {
      const text = block.content.trim();
      const keyMatch = text.match(answerKeyPattern);
      if (keyMatch) {
        const lines = text.split("\n");
        for (const line of lines) {
          const match = line.match(answerLinePattern);
          if (match) {
            answerMap[match[1]!] = match[2]!.toUpperCase();
          }
        }
      }
    }

    let updatedCount = 0;
    for (const question of questions) {
      const answer = answerMap[question.number];
      const options = question.options as string[] | null;
      if (answer && options) {
        const optionIndex = answer.charCodeAt(0) - "A".charCodeAt(0);
        if (optionIndex >= 0 && optionIndex < options.length) {
          await db.update(extractedQuestions)
            .set({
              answerKey: { correctOption: answer, correctText: options[optionIndex] },
              status: "stable",
              updatedAt: new Date(),
            })
            .where(eq(extractedQuestions.id, question.id));
          updatedCount++;
        }
      } else {
        await db.update(extractedQuestions)
          .set({ status: "review", updatedAt: new Date() })
          .where(eq(extractedQuestions.id, question.id));
      }
    }

    logger.info("✅ extract_answers completed", { documentId, updatedCount, totalQuestions: questions.length });

    return {
      documentId,
      status: "answers_extracted",
      answersFound: updatedCount,
      timestamp: new Date().toISOString(),
    };
  },
};
