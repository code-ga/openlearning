import { Type } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { databaseModule } from "../../commons/modules";
import { authenticationModule } from "../../commons/modules/auth";
import { baseResponseSchema, errorResponseSchema } from "../../commons/types";
import { table as schema } from "../../database/schema";
import { dbSchemaTypes, type SchemaStatic } from "../../database/types";

/**
 * for small module we can write all in one file
 * but for the large module we should split it into multiple files like (service, controller (for example: public auth controller and private auth controller), etc)
 * and use index.ts to export all the files
 */
export const profileModule = new Elysia({
	prefix: "/profile",
	name: "profile-controller",
	detail: { description: "Profile Routes", tags: ["Profile"] },
})
	.use(authenticationModule)
	.use(databaseModule)
	.guard(
		{
			optionalAuth: true,
		},
		(app) =>
			app
				.get(
					"/me",
					async (ctx) => {
						const { db } = ctx;

						if (!ctx.user) {
							return ctx.status(401, {
								status: 401,
								message: "Unauthorized",
								timestamp: Date.now(),
								success: false,
							});
						}
						const profiles = await db.query.profile.findFirst({
							where: {
								userId: ctx.user.id,
							},
						});
						const profile = profiles;
						if (!profile) {
							return ctx.status(404, {
								status: 404,
								message: "Profile not found",
								timestamp: Date.now(),
								success: false,
							});
						}
						return ctx.status(200, {
							status: 200,
							data: profile,
							message: "Profile fetched successfully",
							timestamp: Date.now(),
							success: true,
						});
					},
					{
						detail: {
							description: "Get Profile",
						},
						response: {
							200: baseResponseSchema(
								Type.Object({ ...dbSchemaTypes.profile }),
							),
							404: errorResponseSchema,
							401: errorResponseSchema,
						},
					},
				)
				.post(
					"/",
					async (ctx) => {
						const { db } = ctx;
						if (!ctx.user) {
							return ctx.status(401, {
								status: 401,
								message: "Unauthorized",
								timestamp: Date.now(),
								success: false,
							});
						}
						const alreadyExists = await db
							.select()
							.from(schema.profile)
							.where(eq(schema.profile.userId, ctx.user.id))
							.limit(1);
						if (alreadyExists.length > 0) {
							return ctx.status(400, {
								status: 400,
								message: "Profile already exists",
								timestamp: Date.now(),
								success: false,
							});
						}
						const profile = await db
							.insert(schema.profile)
							.values({
								userId: ctx.user.id,
								username: ctx.body.username,
							})
							.returning();
						if (!profile || !profile[0]) {
							return ctx.status(400, {
								status: 400,
								message: "Profile not created",
								timestamp: Date.now(),
								success: false,
							});
						}
						return ctx.status(201, {
							status: 201,
							data: profile[0],
							message: "Profile created successfully",
							timestamp: Date.now(),
							success: true,
						});
					},
					{
						body: Type.Object({
							username: Type.String({ minLength: 3, pattern: "^.*\\S.*$" }),
						}),
						response: {
							201: baseResponseSchema(Type.Object(dbSchemaTypes.profile)),
							400: errorResponseSchema,
							401: errorResponseSchema,
							500: errorResponseSchema,
						},
					},
				)
				.get(
					"/",
					async (ctx) => {
						const { db } = ctx;
						const query = ctx.query;
						if ("profileId" in query) {
							const profiles = await db
								.select()
								.from(schema.profile)
								.where(eq(schema.profile.id, query.profileId))
								.limit(1);
							const profile = profiles[0];
							if (!profile) {
								return ctx.status(400, {
									status: 400,
									message: "Profile not found",
									timestamp: Date.now(),
									success: false,
								});
							}
							return ctx.status(200, {
								status: 200,
								data: profile,
								message: "Profile fetched successfully",
								timestamp: Date.now(),
								success: true,
							});
						}
						if ("userId" in query) {
							const profiles = await db
								.select()
								.from(schema.profile)
								.where(eq(schema.profile.userId, query.userId))
								.limit(1);
							const profile = profiles[0];
							if (!profile) {
								return ctx.status(400, {
									status: 400,
									message: "Profile not found",
									timestamp: Date.now(),
									success: false,
								});
							}
							return ctx.status(200, {
								status: 200,
								data: profile,
								message: "Profile fetched successfully",
								timestamp: Date.now(),
								success: true,
							});
						}
						return ctx.status(400, {
							status: 400,
							message: "Invalid query parameters",
							timestamp: Date.now(),
							success: false,
						});
					},
					{
						query: Type.Union([
							Type.Object({
								profileId: dbSchemaTypes.profile.id,
							}),
							Type.Object({
								userId: dbSchemaTypes.profile.userId,
							}),
						]),
						response: {
							200: baseResponseSchema(Type.Object(dbSchemaTypes.profile)),
							400: errorResponseSchema,
						},
					},
				),
	)
	.guard({ userAuth: true }, (app) =>
		app
			.put(
				"/",
				async (ctx) => {
					const { db } = ctx;
					if (!ctx.user) {
						return ctx.status(401, {
							status: 401,
							message: "Unauthorized",
							timestamp: Date.now(),
							success: false,
						});
					}
					const profile = await db
						.update(schema.profile)
						.set({
							userId: ctx.user.id,
							username: ctx.body.username,
							updatedAt: new Date(),
						})
						.where(eq(schema.profile.userId, ctx.user.id))
						.returning();
					if (!profile || !profile[0]) {
						return ctx.status(400, {
							status: 400,
							message: "Profile not updated",
							timestamp: Date.now(),
							success: false,
						});
					}
					return ctx.status(200, {
						status: 200,
						data: profile[0],
						message: "Profile updated successfully",
						timestamp: Date.now(),
						success: true,
					});
				},
				{
					body: Type.Object({
						username: Type.String({ minLength: 3, pattern: "^.*\\S.*$" }),
					}),
					response: {
						200: baseResponseSchema(Type.Object(dbSchemaTypes.profile)),
						400: errorResponseSchema,
						401: errorResponseSchema,
					},
				},
			)
			.get(
				"/list-user",
				async (ctx) => {
					const { db } = ctx;
					const profiles = await db.select().from(schema.profile);
					return ctx.status(200, {
						status: 200,
						data: profiles,
						message: "Profiles fetched successfully",
						timestamp: Date.now(),
						success: true,
					});
				},
				{
					response: {
						200: baseResponseSchema(
							Type.Array(Type.Object(dbSchemaTypes.profile)),
						),
						400: errorResponseSchema,
					},
					roleAuth: "user:read",
				},
			)
			.get(
				"/search_user",
				async (ctx) => {
					const { db } = ctx;
					const query = ctx.query;
					const profiles: SchemaStatic<typeof dbSchemaTypes.profile>[] = [];
					if (query.type === "username") {
						profiles.push(
							...(await db
								.select()
								.from(schema.profile)
								.where(eq(schema.profile.username, query.username))),
						);
					}
					if (query.type === "userId") {
						profiles.push(
							...(await db
								.select()
								.from(schema.profile)
								.where(eq(schema.profile.userId, query.userId))),
						);
					}
					return ctx.status(200, {
						status: 200,
						data: profiles,
						message: "Profiles fetched successfully",
						timestamp: Date.now(),
						success: true,
					});
				},
				{
					query: Type.Union([
						Type.Object({
							type: Type.Literal("username"),
							username: dbSchemaTypes.profile.username,
						}),
						Type.Object({
							type: Type.Literal("userId"),
							userId: dbSchemaTypes.profile.userId,
						}),
					]),
					response: {
						200: baseResponseSchema(
							Type.Array(Type.Object(dbSchemaTypes.profile)),
						),
						400: errorResponseSchema,
					},
					roleAuth: "user:read",
				},
			),
	);
