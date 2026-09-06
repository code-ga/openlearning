import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { exampleModule } from "./index";

describe("Example Module", () => {
	const app = new Elysia().use(exampleModule);

	it("should return a greeting with default name", async () => {
		const response = await app.handle(new Request("http://localhost/example/"));

		expect(response.status).toBe(200);

		const data = (await response.json()) as any;
		expect(data.success).toBe(true);
		expect(data.message).toBe("Example fetched successfully");
		expect(data.data.message).toBe("Hello Elysia!");
		expect(data.status).toBe(200);
		expect(data.timestamp).toBeDefined();
	});

	it("should return a greeting with provided name", async () => {
		const response = await app.handle(
			new Request("http://localhost/example/?name=John"),
		);

		expect(response.status).toBe(200);

		const data = (await response.json()) as any;
		expect(data.success).toBe(true);
		expect(data.message).toBe("Example fetched successfully");
		expect(data.data.message).toBe("Hello John!");
		expect(data.status).toBe(200);
		expect(data.timestamp).toBeDefined();
	});
});
