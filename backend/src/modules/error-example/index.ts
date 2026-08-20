import { Elysia, t } from "elysia";
import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
	UnauthorizedError,
} from "../../commons/errors";

export const errorExampleModule = new Elysia({ prefix: "/error-example" })
	.get("/400", () => {
		throw new BadRequestError("This is a bad request example");
	})
	.get("/401", () => {
		throw new UnauthorizedError("You are not authorized to view this");
	})
	.get("/403", () => {
		throw new ForbiddenError("You don't have permission to access this");
	})
	.get("/404", () => {
		throw new NotFoundError("The requested resource could not be found");
	})
	.get("/500", () => {
		throw new InternalServerError("An unexpected error occurred");
	})
	.post(
		"/validation",
		({ body }) => {
			return {
				success: true,
				data: body,
			};
		},
		{
			body: t.Object({
				id: t.Number({ error: "id must be a number" }),
				name: t.String({ error: "name must be a string" }),
			}),
		},
	);
