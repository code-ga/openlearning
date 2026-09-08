import Elysia from "elysia";
import { logger } from "../../utils/logger";
import * as errors from "../errors";
import { HttpError } from "../errors";
import type { ErrorResponse } from "../types";

export const notFound = (entity: string): ErrorResponse => ({
	success: false,
	message: `${entity} not found`,
	status: 404,
	details: null,
	timestamp: Date.now(),
});

export const errorHandlerModule = new Elysia({ name: "error-handler" })
	.error(errors)
	.onError((ctx) => {
		const { code, error, set } = ctx;
		logger.error("Error Handler", {
			code,
			error,
		});
		let status = 500;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let message = (error as any).message || "Unknown Error";
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let details: any;

		if (error instanceof HttpError) {
			status = error.status;
			details = error.details;
		} else if (code === "VALIDATION") {
			status = 400;
			message = "Validation Failed";
			details = error.all;
		} else if (code === "NOT_FOUND") {
			status = 404;
			message = "Not Found";
		} else if (code === "PARSE") {
			status = 400;
			message = "Parse Error";
		} else if (code === "INTERNAL_SERVER_ERROR") {
			status = 500;
			message = "Internal Server Error";
		} else {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const err = error as any;
			if (typeof err.status === "number") {
				status = err.status;
			}
			message = err.message || "Unknown Error";
		}

		set.status = status;

		return {
			success: false,
			message,
			status,
			details,
			timestamp: Date.now(),
		} as ErrorResponse;
	})
	.as("global");
