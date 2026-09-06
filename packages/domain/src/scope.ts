import { z } from "zod";
import { entitySchema, idSchema } from "./base";

export const knowledgeScopeSchema = entitySchema.extend({
  name: z.string().min(1),
  curriculum: z.string().optional(),
  educationLevel: z.string().optional(),
  examType: z.string().optional(),
  region: z.string().optional(),
  validFrom: z.date().or(z.string().datetime()).optional(),
  validTo: z.date().or(z.string().datetime()).optional(),
  includedSkillIds: z.array(idSchema).default([]),
  excludedSkillIds: z.array(idSchema).default([]),
  parentScopeId: idSchema.optional().nullable(),
});

export type KnowledgeScope = z.infer<typeof knowledgeScopeSchema>;
