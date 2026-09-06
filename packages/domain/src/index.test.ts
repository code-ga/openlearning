import { describe, expect, test } from "bun:test";
import {
  problemSchema,
  knowledgeNodeSchema,
  assessmentSchema,
  skillSchema,
  isProblem,
  isKnowledgeNode,
  isAssessment,
  isSkill,
} from "./index";

describe("Domain Package Unit Tests", () => {
  test("validates Skill entity and type guard", () => {
    const validSkill = {
      id: "skill_123",
      code: "MATH-ALG-01",
      name: "Linear Equations",
      description: "Solving single-variable linear equations",
      scopeIds: ["scope_thpt"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(isSkill(validSkill)).toBe(true);
    const parsed = skillSchema.parse(validSkill);
    expect(parsed.code).toBe("MATH-ALG-01");
  });

  test("validates Problem entity with solution approaches", () => {
    const validProblem = {
      id: "prob_456",
      statement: "Solve 2x + 5 = 15",
      skillIds: ["skill_123"],
      scopeIds: ["scope_thpt"],
      solutionApproachIds: ["approach_01"],
      difficulty: {
        estimatedLevel: 2,
        confidence: 0.8,
        calibrated: true,
      },
      sourceIds: ["doc_789"],
      status: "stable",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(isProblem(validProblem)).toBe(true);
    const parsed = problemSchema.parse(validProblem);
    expect(parsed.status).toBe("stable");
  });

  test("validates 4-layer Assessment hierarchy", () => {
    const validAssessment = {
      id: "assm_1",
      problemId: "prob_456",
      type: "single_choice",
      title: "Linear Equation Quiz",
      items: [
        {
          id: "item_1",
          assessmentId: "assm_1",
          order: 1,
          statement: "What is x?",
          answerKey: { correctOption: "x=5" },
          skillIds: ["skill_123"],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(isAssessment(validAssessment)).toBe(true);
    const parsed = assessmentSchema.parse(validAssessment);
    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0]?.statement).toBe("What is x?");
  });

  test("validates KnowledgeNode entity and kinds", () => {
    const validNode = {
      id: "node_1",
      kind: "concept",
      title: "AM-GM Inequality",
      content: "For non-negative real numbers, arithmetic mean >= geometric mean",
      scopeIds: ["scope_thpt"],
      sourceIds: ["doc_789"],
      status: "stable",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(isKnowledgeNode(validNode)).toBe(true);
    const parsed = knowledgeNodeSchema.parse(validNode);
    expect(parsed.kind).toBe("concept");
  });
});
