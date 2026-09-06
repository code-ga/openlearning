import { z } from "zod";
import { entitySchema, idSchema } from "./base";

export const knowledgeNodeKindSchema = z.enum([
  "concept",
  "statement",
  "definition",
  "procedure",
  "example",
  "experiment",
  "observation",
  "claim",
  "resource",
  "skill",
]);

export type KnowledgeNodeKind = z.infer<typeof knowledgeNodeKindSchema>;

export const knowledgeNodeStatusSchema = z.enum(["draft", "review", "stable", "deprecated"]);

export type KnowledgeNodeStatus = z.infer<typeof knowledgeNodeStatusSchema>;

export const knowledgeNodeSchema = entitySchema.extend({
  kind: knowledgeNodeKindSchema,
  title: z.string().min(1),
  content: z.string(),
  scopeIds: z.array(idSchema).default([]),
  sourceIds: z.array(idSchema).default([]),
  confidence: z.number().min(0).max(1).optional(),
  status: knowledgeNodeStatusSchema.default("draft"),
});

export type KnowledgeNode = z.infer<typeof knowledgeNodeSchema>;

export const knowledgeRelationTypeSchema = z.enum([
  "depends_on",
  "requires",
  "supports",
  "contradicts",
  "proves",
  "derived_from",
  "explains",
  "example_of",
  "generalizes",
  "specializes",
  "applies_to",
  "tested_by",
  "solves",
  "related_to",
]);

export type KnowledgeRelationType = z.infer<typeof knowledgeRelationTypeSchema>;

export const knowledgeRelationSchema = entitySchema.extend({
  fromId: idSchema,
  toId: idSchema,
  type: knowledgeRelationTypeSchema,
  confidence: z.number().min(0).max(1).optional(),
  sourceIds: z.array(idSchema).optional(),
});

export type KnowledgeRelation = z.infer<typeof knowledgeRelationSchema>;
