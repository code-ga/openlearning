import { describe, expect, test } from "bun:test";
import { app } from "./index";

describe("API Endpoint Integration Tests", () => {
	test("GET /health returns system status ok", async () => {
		const response = await app.handle(new Request("http://localhost/health"));
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			success: boolean;
			data: { status: string };
		};
		expect(body.success).toBe(true);
		expect(body.data.status).toBe("ok");
	});

	test("GET /api/v1/scopes returns array of scopes", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/v1/scopes"),
		);
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			success: boolean;
			data: unknown[];
		};
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
	});

	test("GET /api/v1/skills returns array of skills", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/v1/skills"),
		);
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			success: boolean;
			data: unknown[];
		};
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
	});

	test("GET /api/v1/problems returns array of problems", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/v1/problems"),
		);
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			success: boolean;
			data: unknown[];
		};
		expect(body.success).toBe(true);
		expect(Array.isArray(body.data)).toBe(true);
	});

	test("GET /api/v1/scopes/:id returns standardized error for non-existent scope", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/v1/scopes/non-existent-id"),
		);
		const body = (await response.json()) as {
			success: boolean;
			message: string;
			status: number;
			details: unknown;
			timestamp: number;
		};
		expect(body.success).toBe(false);
		expect(body.status).toBeGreaterThanOrEqual(400);
		expect(body.message).toBeDefined();
		expect(body.timestamp).toBeDefined();
	});

	test("GET /api/v1/skills/:id returns standardized error for non-existent skill", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/v1/skills/non-existent-id"),
		);
		const body = (await response.json()) as {
			success: boolean;
			message: string;
			status: number;
			details: unknown;
			timestamp: number;
		};
		expect(body.success).toBe(false);
		expect(body.status).toBeGreaterThanOrEqual(400);
		expect(body.message).toBeDefined();
		expect(body.timestamp).toBeDefined();
	});

	test("GET /api/v1/problems/:id returns standardized error for non-existent problem", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/v1/problems/non-existent-id"),
		);
		const body = (await response.json()) as {
			success: boolean;
			message: string;
			status: number;
			details: unknown;
			timestamp: number;
		};
		expect(body.success).toBe(false);
		expect(body.status).toBeGreaterThanOrEqual(400);
		expect(body.message).toBeDefined();
		expect(body.timestamp).toBeDefined();
	});

	test("POST /api/v1/problems returns standardized error response", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/v1/problems", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					statement: "Test problem statement",
					skillIds: ["skill_test"],
					scopeIds: ["scope_test"],
				}),
			}),
		);
		const body = (await response.json()) as {
			success: boolean;
			message: string;
			status: number;
			timestamp: number;
		};
		expect(body.success).toBe(false);
		expect(body.status).toBeGreaterThanOrEqual(400);
		expect(body.message).toBeDefined();
		expect(body.timestamp).toBeDefined();
	});

	test("unknown route returns standardized error shape", async () => {
		const response = await app.handle(
			new Request("http://localhost/non-existent-route"),
		);
		expect(response.status).toBe(404);

		const body = (await response.json()) as {
			success: boolean;
			message: string;
			status: number;
		};
		expect(body.success).toBe(false);
		expect(body.status).toBe(404);
		expect(body.message).toBeDefined();
	});
});
