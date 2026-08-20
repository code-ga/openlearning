import { defineRelations } from "drizzle-orm";
import * as auth from "./auth";

export const table = {
	...auth,
} as const;

export const schemaRelations = defineRelations(table, (r) => ({
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
		profile: r.one.profile({
			from: r.user.id,
			to: r.profile.userId,
		}),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
		}),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
		}),
	},
	profile: {
		user: r.one.user({
			from: r.profile.userId,
			to: r.user.id,
		}),
	},
}));
export type Table = typeof table;
