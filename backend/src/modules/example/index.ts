import { Elysia, t } from "elysia";
import { baseResponseSchema } from "../../commons/types";

export const exampleModule = new Elysia({ prefix: "/example" }).get(
	"/",
	({ query }) => {
		return {
			success: true,
			message: "Example fetched successfully",
			data: {
				message: `Hello ${query.name || "Elysia"}!`,
			},
			timestamp: Date.now(),
			status: 200,
		};
	},
	{
		query: t.Object({
			name: t.Optional(t.String()),
		}),
		response: {
			200: baseResponseSchema(
				t.Object({
					message: t.String(),
				}),
			),
		},
		detail: {
			tags: ["Example"],
			summary: "Get example response",
			description:
				"Returns an example greeting, optionally taking a name query parameter.",
		},
	},
);
