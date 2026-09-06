import { db } from "./client";
import { scopes, skills, knowledgeNodes, problems, solutionApproaches, workerJobs } from "./schema";
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

    // 5. Seed Test Worker Job
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
