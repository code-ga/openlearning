export class HttpError extends Error {
	constructor(
		public message: string,
		public status: number,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		public details?: any,
	) {
		super(message);
		this.name = this.constructor.name;
	}

	toResponse() {
		return Response.json(
			{
				success: false,
				message: this.message,
				status: this.status,
				details: this.details,
				timestamp: Date.now(),
			},
			{
				status: this.status,
			},
		);
	}
}

export class BadRequestError extends HttpError {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(message = "Bad Request", details?: any) {
		super(message, 400, details);
	}
}

export class UnauthorizedError extends HttpError {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(message = "Unauthorized", details?: any) {
		super(message, 401, details);
	}
}

export class ForbiddenError extends HttpError {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(message = "Forbidden", details?: any) {
		super(message, 403, details);
	}
}

export class NotFoundError extends HttpError {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(message = "Not Found", details?: any) {
		super(message, 404, details);
	}
}

export class InternalServerError extends HttpError {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(message = "Internal Server Error", details?: any) {
		super(message, 500, details);
	}
}
