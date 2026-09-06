export * from "./base";
export * from "./scope";
export * from "./knowledge";
export * from "./skill";
export * from "./problem";
export * from "./assessment";

// Type guard helpers
import { knowledgeNodeSchema, type KnowledgeNode } from "./knowledge";
import { problemSchema, type Problem } from "./problem";
import { assessmentSchema, type Assessment } from "./assessment";
import { skillSchema, type Skill } from "./skill";

export function isKnowledgeNode(obj: unknown): obj is KnowledgeNode {
  return knowledgeNodeSchema.safeParse(obj).success;
}

export function isProblem(obj: unknown): obj is Problem {
  return problemSchema.safeParse(obj).success;
}

export function isAssessment(obj: unknown): obj is Assessment {
  return assessmentSchema.safeParse(obj).success;
}

export function isSkill(obj: unknown): obj is Skill {
  return skillSchema.safeParse(obj).success;
}
