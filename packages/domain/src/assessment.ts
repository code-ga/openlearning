import { z } from "zod";
import { entitySchema, idSchema } from "./base";

export const assessmentTypeSchema = z.enum([
  "single_choice",
  "multiple_choice",
  "true_false",
  "matching",
  "ordering",
  "short_answer",
  "numeric",
  "open_response",
]);

export type AssessmentType = z.infer<typeof assessmentTypeSchema>;

export const assessmentItemSchema = z.object({
  id: idSchema,
  assessmentId: idSchema,
  order: z.number().int().nonnegative(),
  statement: z.string(),
  answerKey: z.unknown(), // Json representation of key
  skillIds: z.array(idSchema).default([]),
  explanation: z.string().optional(),
});

export type AssessmentItem = z.infer<typeof assessmentItemSchema>;

export const assessmentSchema = entitySchema.extend({
  problemId: idSchema,
  type: assessmentTypeSchema,
  title: z.string().optional(),
  instructions: z.string().optional(),
  items: z.array(assessmentItemSchema).default([]),
});

export type Assessment = z.infer<typeof assessmentSchema>;

export const itemResultSchema = z.object({
  itemId: idSchema,
  givenAnswer: z.unknown(),
  isCorrect: z.boolean(),
  score: z.number().nonnegative(),
  feedback: z.string().optional(),
});

export type ItemResult = z.infer<typeof itemResultSchema>;

export const attemptSchema = entitySchema.extend({
  assessmentId: idSchema,
  studentId: idSchema,
  itemResults: z.array(itemResultSchema).default([]),
  totalScore: z.number().nonnegative(),
  durationMs: z.number().int().nonnegative().optional(),
  startedAt: z.date().or(z.string().datetime()),
  completedAt: z.date().or(z.string().datetime()).optional(),
});

export type Attempt = z.infer<typeof attemptSchema>;
