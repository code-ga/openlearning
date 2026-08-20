import { betterAuth, logger } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import Elysia from "elysia";
import * as schema from "../../database/schema/auth";
import { type DatabaseType, databaseModule } from ".";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const createAuthConfig = (db: DatabaseType) =>
	betterAuth({
		database: drizzleAdapter(db, { provider: "pg", schema }),
		baseURL: "http://localhost:3000/",
		emailAndPassword: { enabled: true },
		socialProviders: {
			discord: {
				clientId: process.env.DISCORD_CLIENT_ID!,
				clientSecret: process.env.DISCORD_CLIENT_SECRET!,
			},
			facebook: {
				clientId: process.env.FACEBOOK_CLIENT_ID!,
				clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
			},
			github: {
				clientId: process.env.GITHUB_CLIENT_ID!,
				clientSecret: process.env.GITHUB_CLIENT_SECRET!,
			},
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			},
		},
	});

export const authenticationModule = new Elysia({
	name: "auth-module",
})
	.use(databaseModule)
	.decorate(({ db }) => ({ auth: createAuthConfig(db), db }))
	.macro({
		userAuth: {
			async resolve({ status, request: { headers, url }, auth, db }) {
				logger.info("Authentication middleware");
				logger.info("Path: ", url);
				const session = await auth.api.getSession({
					headers,
				});

				if (!session)
					return status(401, { success: false, message: "Unauthorized" });
				const profile = await db.query.profile.findFirst({
					where: {
						userId: session.user.id,
					},
				});
				if (!profile)
					return status(401, { success: false, message: "Unauthorized" });
				return {
					user: session.user,
					session: session.session,
					profile: profile,
				};
			},
		},
		optionalAuth: {
			async resolve({ request: { headers }, auth, db }) {
				const session = await auth.api.getSession({ headers });
				return {
					user: session?.user,
					session: session?.session,
					profile: session?.user
						? await db.query.profile.findFirst({
								where: { userId: session.user.id },
							})
						: null,
				};
			},
		},
	});
