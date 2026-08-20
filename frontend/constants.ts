import { logger } from "./lib/logger";
export const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL ||
	(process.env.NODE_ENV === "development"
		? "http://localhost:3001"
		: "/api");
export const FRONTEND_URL =
	process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
logger.info(FRONTEND_URL);