/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { treaty } from "@elysiajs/eden";
import type { App, databaseTypes } from "@comic-sharing/backend";
import type { Static, TSchema } from "@sinclair/typebox";
import { BACKEND_URL } from "../constants";

export const api = treaty<App>(BACKEND_URL, {
	fetch: {
		credentials: "include",
		redirect: "follow",
	},
});

/**
 * Safely extracts an error message from an Eden (treaty) response error.
 */
export function getEdenErrorMessage(error: any): string {
	if (!error) return "An unknown error occurred";
	const value = error.value;
	if (typeof value === "string") return value;

	if (value && typeof value === "object") {
		if ("message" in value) {
			const msg = (value as { message: string }).message;
			
			// Handle standard backend error response with validation details
			if ("details" in value && Array.isArray((value as any).details)) {
				const details = (value as any).details;
				const detailMsgs = details
					.map((d: any) => d.summary || d.message || `${d.path || "Field"} is invalid`)
					.filter(Boolean)
					.join(", ");
				
				if (detailMsgs) {
					return `${msg}: ${detailMsgs}`;
				}
			}
			return msg;
		}
	}

	return JSON.stringify(value || error.message || error);
}


export type SchemaStatic<P extends Record<string, TSchema>> = {
	[T in keyof P]: Static<P[T]>;
};

export type { databaseTypes, requestTypes } from "@comic-sharing/backend";
export type SchemaType = {
	[T in keyof databaseTypes.databaseTypes]: SchemaStatic<
		databaseTypes.databaseTypes[T]
	>;
};

export type Api = App;
