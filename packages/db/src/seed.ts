import { db } from "./client";
import { scopes, skills, knowledgeNodes, problems, solutionApproaches, workerJobs, sourceDocuments, sourcePages, sourceBlocks, extractedQuestions, provenance } from "./schema";
import { logger } from "@openlearning/config";

export async function seedDatabase() {
  logger.info("🌱 Starting database seeding...");

  const scopeId = "scope_thpt_math";
  const skillId1 = "skill_alg_linear";
  const skillId2 = "skill_alg_amgm";
  const problemId1 = "prob_linear_01";
  const nodeId1 = "node_amgm_concept";

  try {
    // 1. Seed Scope
    await db
      .insert(scopes)
      .values({
        id: scopeId,
        name: "THPT Mathematics",
        curriculum: "Vietnam Ministry of Education 2018",
        educationLevel: "Grade 12",
        examType: "Graduation & University Entrance",
        includedSkillIds: [skillId1, skillId2],
      })
      .onConflictDoNothing();

    // 2. Seed Skills
    await db
      .insert(skills)
      .values([
        {
          id: skillId1,
          code: "MATH.ALG.LINEAR",
          name: "Linear Equations",
          description: "Solving single-variable and system linear equations",
          scopeIds: [scopeId],
          difficulty: 2.0,
        },
        {
          id: skillId2,
          code: "MATH.ALG.AMGM",
          name: "AM-GM Inequality",
          description: "Applying Arithmetic Mean - Geometric Mean inequality for optimization",
          scopeIds: [scopeId],
          difficulty: 7.0,
        },
      ])
      .onConflictDoNothing();

    // 3. Seed Knowledge Node
    await db
      .insert(knowledgeNodes)
      .values({
        id: nodeId1,
        kind: "concept",
        title: "AM-GM Inequality Concept",
        content: "For non-negative real numbers a_1, ..., a_n: (a_1 + ... + a_n)/n >= (a_1 * ... * a_n)^(1/n)",
        scopeIds: [scopeId],
        status: "stable",
      })
      .onConflictDoNothing();

    // 4. Seed Problem & Solution
    await db
      .insert(problems)
      .values({
        id: problemId1,
        statement: "Solve for x: 3x - 7 = 14",
        skillIds: [skillId1],
        scopeIds: [scopeId],
        difficulty: { estimatedLevel: 2, confidence: 0.9, calibrated: true },
        status: "stable",
      })
      .onConflictDoNothing();

    await db
      .insert(solutionApproaches)
      .values({
        id: "sol_linear_01",
        problemId: problemId1,
        title: "Algebraic Isolation",
        strategy: "Add 7 to both sides, then divide by 3",
        steps: [
          { order: 1, description: "Add 7 to both sides: 3x = 21" },
          { order: 2, description: "Divide both sides by 3: x = 7" },
        ],
        requiredSkillIds: [skillId1],
      })
      .onConflictDoNothing();

    // 5. Seed Fixture Document for Testing
    const fixtureDocId = "doc_fixture_math_01";
    await db
      .insert(sourceDocuments)
      .values({
        id: fixtureDocId,
        filename: "math_exam_sample.pdf",
        mimeType: "application/pdf",
        fileSize: 102400,
        storagePath: "storage/pdfs/fixture/math_exam_sample.pdf",
        checksum: "fixture_checksum_123",
        status: "processed",
        metadata: { fixture: true, pages: 2 },
      })
      .onConflictDoNothing();

    // 6. Seed Fixture Pages
    await db
      .insert(sourcePages)
      .values([
        {
          id: "page_fixture_1",
          documentId: fixtureDocId,
          pageNumber: 1,
          width: 612,
          height: 792,
          content: "Question 1. Solve for x: 2x + 5 = 15\nA. x = 5\nB. x = 3\nC. x = 10\nD. x = 2\n\nQuestion 2. Find the value of y: 3y - 4 = 8\nA. y = 4\nB. y = 2\nC. y = 5\nD. y = 3",
        },
        {
          id: "page_fixture_2",
          documentId: fixtureDocId,
          pageNumber: 2,
          width: 612,
          height: 792,
          content: "Answer Key:\n1. A\n2. A",
        },
      ])
      .onConflictDoNothing();

    // 7. Seed Fixture Blocks
    await db
      .insert(sourceBlocks)
      .values([
        {
          id: "block_fixture_1",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 0,
          content: "Question 1. Solve for x: 2x + 5 = 15",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_2",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 1,
          content: "A. x = 5",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_3",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 2,
          content: "B. x = 3",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_4",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 3,
          content: "C. x = 10",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_5",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 4,
          content: "D. x = 2",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_6",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 5,
          content: "Question 2. Find the value of y: 3y - 4 = 8",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_7",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 6,
          content: "A. y = 4",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_8",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 7,
          content: "B. y = 2",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_9",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 8,
          content: "C. y = 5",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_10",
          documentId: fixtureDocId,
          pageId: "page_fixture_1",
          pageNumber: 1,
          blockIndex: 9,
          content: "D. y = 3",
          kind: "text",
          bbox: null,
        },
        {
          id: "block_fixture_11",
          documentId: fixtureDocId,
          pageId: "page_fixture_2",
          pageNumber: 2,
          blockIndex: 0,
          content: "Answer Key:\n1. A\n2. A",
          kind: "text",
          bbox: null,
        },
      ])
      .onConflictDoNothing();

    // 8. Seed Fixture Extracted Questions
    await db
      .insert(extractedQuestions)
      .values([
        {
          id: "eq_fixture_1",
          sourceDocumentId: fixtureDocId,
          pageStart: 1,
          pageEnd: 1,
          startBlockId: "block_fixture_1",
          endBlockId: "block_fixture_5",
          number: "1",
          statement: "Solve for x: 2x + 5 = 15",
          options: ["x = 5", "x = 3", "x = 10", "x = 2"],
          answerKey: { correctOption: "A", correctText: "x = 5" },
          confidence: 0.9,
          status: "stable",
        },
        {
          id: "eq_fixture_2",
          sourceDocumentId: fixtureDocId,
          pageStart: 1,
          pageEnd: 1,
          startBlockId: "block_fixture_6",
          endBlockId: "block_fixture_10",
          number: "2",
          statement: "Find the value of y: 3y - 4 = 8",
          options: ["y = 4", "y = 2", "y = 5", "y = 3"],
          answerKey: { correctOption: "A", correctText: "y = 4" },
          confidence: 0.9,
          status: "stable",
        },
      ])
      .onConflictDoNothing();

    // 9. Seed Provenance
    await db
      .insert(provenance)
      .values([
        {
          id: "prov_fixture_1",
          entityType: "source_page",
          entityId: "page_fixture_1",
          sourceDocumentId: fixtureDocId,
          pageNumber: 1,
          extractorPipeline: "pdf-parse:v1",
          confidenceScore: "1.0",
        },
        {
          id: "prov_fixture_2",
          entityType: "source_page",
          entityId: "page_fixture_2",
          sourceDocumentId: fixtureDocId,
          pageNumber: 2,
          extractorPipeline: "pdf-parse:v1",
          confidenceScore: "1.0",
        },
      ])
      .onConflictDoNothing();

    // 10. Seed Test Worker Job
    await db
      .insert(workerJobs)
      .values({
        id: "job_seed_ping",
        jobType: "ping_job",
        status: "pending",
        payload: { message: "Initial Seed Ping Job" },
      })
      .onConflictDoNothing();

    logger.info("✅ Database seeding completed successfully!");
  } catch (error) {
    logger.error("❌ Database seeding failed", { error: String(error) });
    throw error;
  }
}

// Allow direct execution via CLI `bun run src/seed.ts`
if (import.meta.main) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
