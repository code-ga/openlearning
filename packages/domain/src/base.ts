import { z } from "zod";

export type ID = string;

export const idSchema = z.string().min(1);

export const entitySchema = z.object({
  id: idSchema,
  createdAt: z.date().or(z.string().datetime()),
  updatedAt: z.date().or(z.string().datetime()),
  deletedAt: z.date().or(z.string().datetime()).nullable().optional(),
});

export type Entity = z.infer<typeof entitySchema>;
