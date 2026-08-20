import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { databaseModule, errorHandlerModule } from "./commons/modules";
import { authenticationModule } from "./commons/modules/auth";
import { loggerMiddleware } from "./commons/modules/logger";
import { errorExampleModule } from "./modules/error-example";
import { exampleModule } from "./modules/example";
import { profileModule } from "./modules/profile";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 3001;

const app = new Elysia()
	.use(
		cors({
			// methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			credentials: true,
		}),
	)
	.use(loggerMiddleware)
	.use(authenticationModule)
	.use(databaseModule)
	.use(errorHandlerModule)
	.use(
		openapi({
			documentation: {},
		}),
	)
	.get("/", () => "Hello Elysia")
	.use(profileModule)
	.use(errorExampleModule)
	.use(exampleModule)
	.listen(PORT);

logger.info(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

process.on("uncaughtException", (error) => {
	logger.fatal("Uncaught Exception", {
		error: error.message,
		stack: error.stack,
	});
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection at:", { promise, reason });
});

export type App = typeof app;
export * as requestTypes from "./commons/types";
export * as databaseTypes from "./database/types";
