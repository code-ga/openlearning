import { describe, expect, test } from "bun:test";
///@ts-ignore
import { app } from "./index";

describe("API Endpoint Integration Tests", () => {
  test("GET /health returns system status ok", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as { success: boolean; data: { status: string } };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
  });

  test("GET /api/v1/scopes returns array of scopes", async () => {
    const response = await app.handle(new Request("http://localhost/api/v1/scopes"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("GET /api/v1/skills returns array of skills", async () => {
    const response = await app.handle(new Request("http://localhost/api/v1/skills"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("GET /api/v1/problems returns array of problems", async () => {
    const response = await app.handle(new Request("http://localhost/api/v1/problems"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
