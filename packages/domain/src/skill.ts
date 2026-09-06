import { z } from "zod";
import { entitySchema, idSchema } from "./base";

export const skillSchema = entitySchema.extend({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  parentSkillId: idSchema.optional().nullable(),
  scopeIds: z.array(idSchema).default([]),
  difficulty: z.number().min(0).max(10).optional(),
});

export type Skill = z.infer<typeof skillSchema>;
