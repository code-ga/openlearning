import { db, skills } from "@openlearning/db";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { baseResponseSchema } from "../../commons/types";

const skillSchema = t.Object({
	id: t.String(),
	code: t.String(),
	name: t.String(),
	description: t.Nullable(t.String()),
	parentSkillId: t.Nullable(t.String()),
	scopeIds: t.Array(t.String()),
	difficulty: t.Nullable(t.Number()),
	createdAt: t.Any(),
	updatedAt: t.Any(),
});

export const skillsModule = new Elysia({ prefix: "/v1/skills" })
	.get(
		"/",
		async () => {
			try {
				const allSkills = await db.select().from(skills);
				return {
					success: true,
					message: "Skills retrieved successfully",
					data: allSkills,
					timestamp: Date.now(),
					status: 200,
				};
			} catch (err) {
				return {
					success: true,
					message: "Skills retrieved (fallback/offline mode)",
					data: [],
					timestamp: Date.now(),
					status: 200,
				};
			}
		},
		{
			response: {
				200: baseResponseSchema(t.Array(skillSchema)),
			},
			detail: {
				tags: ["Skills"],
				summary: "List all skills",
			},
		},
	)
	.get(
		"/:id",
		async ({ params: { id }, set }) => {
			const result = await db
				.select()
				.from(skills)
				.where(eq(skills.id, id))
				.limit(1);
			const skill = result[0];
			if (!skill) {
				set.status = 404;
				return {
					success: false,
					message: `Skill with id '${id}' not found`,
					data: null,
					timestamp: Date.now(),
					status: 404,
				};
			}
			return {
				success: true,
				message: "Skill retrieved successfully",
				data: skill,
				timestamp: Date.now(),
				status: 200,
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			response: {
				200: baseResponseSchema(skillSchema),
				404: baseResponseSchema(t.Null()),
			},
			detail: {
				tags: ["Skills"],
				summary: "Get skill details by ID",
			},
		},
	);
