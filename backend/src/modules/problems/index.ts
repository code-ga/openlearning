import { db, problems, solutionApproaches } from "@openlearning/db";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { notFound } from "../../commons/modules/error-handler";
import { baseResponseSchema, errorResponseSchema } from "../../commons/types";

const problemSchema = t.Object({
	id: t.String(),
	statement: t.String(),
	assumptions: t.Nullable(t.Array(t.String())),
	goals: t.Nullable(t.Array(t.String())),
	skillIds: t.Array(t.String()),
	scopeIds: t.Array(t.String()),
	solutionApproachIds: t.Array(t.String()),
	difficulty: t.Object({
		estimatedLevel: t.Number(),
		confidence: t.Number(),
		calibrated: t.Boolean(),
	}),
	sourceIds: t.Array(t.String()),
	status: t.String(),
	createdAt: t.Any(),
	updatedAt: t.Any(),
});

export const problemsModule = new Elysia({ prefix: "/v1/problems" })
	.get(
		"/",
		async () => {
			try {
				const allProblems = await db.select().from(problems);
				return {
					success: true,
					message: "Problems retrieved successfully",
					data: allProblems,
					timestamp: Date.now(),
					status: 200,
				};
			} catch (_err) {
				return {
					success: true,
					message: "Problems retrieved (fallback/offline mode)",
					data: [],
					timestamp: Date.now(),
					status: 200,
				};
			}
		},
		{
			response: {
				200: baseResponseSchema(t.Array(problemSchema)),
				400: errorResponseSchema,
				500: errorResponseSchema,
			},
			detail: {
				tags: ["Problems"],
				summary: "List all canonical problems",
			},
		},
	)
	.get(
		"/:id",
		async ({ params: { id }, set }) => {
			try {
				const problemList = await db
					.select()
					.from(problems)
					.where(eq(problems.id, id))
					.limit(1);
				const problem = problemList[0];
				if (!problem) {
					set.status = 404;
					return notFound("Problem");
				}
				const approaches = await db
					.select()
					.from(solutionApproaches)
					.where(eq(solutionApproaches.problemId, id));

				set.status = 200;
				return {
					success: true,
					message: "Problem retrieved successfully",
					data: {
						...problem,
						approaches,
					},
					timestamp: Date.now(),
					status: 200,
				};
			} catch (err) {
				set.status = 500;
				return {
					success: false,
					message: "Failed to retrieve problem",
					status: 500,
					details: err instanceof Error ? err.message : undefined,
					timestamp: Date.now(),
				};
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			response: {
				200: baseResponseSchema(
					t.Intersect([
						problemSchema,
						t.Object({
							approaches: t.Array(t.Any()),
						}),
					]),
				),
				404: errorResponseSchema,
				400: errorResponseSchema,
				500: errorResponseSchema,
			},
			detail: {
				tags: ["Problems"],
				summary: "Get problem by ID with solution approaches",
			},
		},
	)
	.post(
		"/",
		async ({ body, set }) => {
			try {
				const id = createId();
				const newProblem = {
					id,
					statement: body.statement,
					assumptions: body.assumptions || [],
					goals: body.goals || [],
					skillIds: body.skillIds || [],
					scopeIds: body.scopeIds || [],
					solutionApproachIds: [],
					difficulty: body.difficulty || {
						estimatedLevel: 1,
						confidence: 0.5,
						calibrated: false,
					},
					sourceIds: body.sourceIds || [],
					status: body.status || "draft",
				};

				await db.insert(problems).values(newProblem);
				const created = (
					await db.select().from(problems).where(eq(problems.id, id)).limit(1)
				)[0];

				set.status = 201;
				return {
					success: true,
					message: "Problem created successfully",
					data: created,
					timestamp: Date.now(),
					status: 201,
				};
			} catch (err) {
				set.status = 500;
				return {
					success: false,
					message: "Failed to create problem",
					status: 500,
					details: err instanceof Error ? err.message : undefined,
					timestamp: Date.now(),
				};
			}
		},
		{
			body: t.Object({
				statement: t.String({ minLength: 1 }),
				assumptions: t.Optional(t.Array(t.String())),
				goals: t.Optional(t.Array(t.String())),
				skillIds: t.Optional(t.Array(t.String())),
				scopeIds: t.Optional(t.Array(t.String())),
				difficulty: t.Optional(
					t.Object({
						estimatedLevel: t.Number(),
						confidence: t.Number(),
						calibrated: t.Boolean(),
					}),
				),
				sourceIds: t.Optional(t.Array(t.String())),
				status: t.Optional(t.String()),
			}),
			response: {
				201: baseResponseSchema(problemSchema),
				400: errorResponseSchema,
				500: errorResponseSchema,
			},
			detail: {
				tags: ["Problems"],
				summary: "Create a new canonical problem",
			},
		},
	);
