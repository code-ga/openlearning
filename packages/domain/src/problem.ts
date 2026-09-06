import { z } from "zod";
import { entitySchema, idSchema } from "./base";

export const difficultyEstimateSchema = z.object({
  estimatedLevel: z.number().default(1),
  confidence: z.number().min(0).max(1).default(0.5),
  calibrated: z.boolean().default(false),
});

export type DifficultyEstimate = z.infer<typeof difficultyEstimateSchema>;

export const solutionStepSchema = z.object({
  order: z.number().int().positive(),
  description: z.string().min(1),
  inputKnowledgeIds: z.array(idSchema).optional(),
  outputKnowledgeIds: z.array(idSchema).optional(),
  skillIds: z.array(idSchema).optional(),
});

export type SolutionStep = z.infer<typeof solutionStepSchema>;

export const solutionApproachSchema = entitySchema.extend({
  problemId: idSchema,
  title: z.string().min(1),
  strategy: z.string(),
  steps: z.array(solutionStepSchema).default([]),
  requiredSkillIds: z.array(idSchema).default([]),
  applicability: z.string().optional(),
  pedagogicalProfile: z
    .object({
      algebraic: z.boolean().optional(),
      geometric: z.boolean().optional(),
      computational: z.boolean().optional(),
      conceptual: z.boolean().optional(),
    })
    .optional(),
  sourceIds: z.array(idSchema).optional(),
});

export type SolutionApproach = z.infer<typeof solutionApproachSchema>;

export const problemStatusSchema = z.enum(["draft", "review", "stable", "deprecated"]);

export type ProblemStatus = z.infer<typeof problemStatusSchema>;

export const problemSchema = entitySchema.extend({
  statement: z.string().min(1),
  assumptions: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  skillIds: z.array(idSchema).default([]),
  scopeIds: z.array(idSchema).default([]),
  solutionApproachIds: z.array(idSchema).default([]),
  difficulty: difficultyEstimateSchema.default({
    estimatedLevel: 1,
    confidence: 0.5,
    calibrated: false,
  }),
  sourceIds: z.array(idSchema).default([]),
  status: problemStatusSchema.default("draft"),
});

export type Problem = z.infer<typeof problemSchema>;
