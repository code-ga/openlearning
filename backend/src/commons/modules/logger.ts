import Elysia from "elysia";
import { logger } from "@openlearning/config";

export const loggerMiddleware = new Elysia({ name: "logger" })
	.onRequest(({ request }) => {
		logger.info(`Received request: ${request.method} ${request.url}`, {
			method: request.method,
			url: request.url,
			headers: Object.fromEntries(request.headers.entries()),
		});
	})
	.onAfterHandle(({ request, set }) => {
		logger.info(`Responded to request: ${request.method} ${request.url}`, {
			method: request.method,
			url: request.url,
			status: set.status,
		});
	})
	.onError(({ request, error, set }) => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const err = error as Record<string, any>;
		logger.error(`Error processing request: ${request.method} ${request.url}`, {
			method: request.method,
			url: request.url,
			status: set.status,
			error: {
				message: err.message || String(error),
				name: err.name || "UnknownError",
				stack: err.stack,
			},
		});
	})
	.as("global");
