import { describe, expect, test } from "bun:test";
import {
  users,
  scopes,
  skills,
  problems,
  knowledgeNodes,
  assessments,
  workerJobs,
  createDbClient,
} from "./index";

describe("Database Package Tests", () => {
  test("exports all required Drizzle tables", () => {
    expect(users).toBeDefined();
    expect(scopes).toBeDefined();
    expect(skills).toBeDefined();
    expect(problems).toBeDefined();
    expect(knowledgeNodes).toBeDefined();
    expect(assessments).toBeDefined();
    expect(workerJobs).toBeDefined();
  });

  test("initializes Drizzle client instance without throwing", () => {
    expect(() => {
      // Mock pool or initialize client check
      const client = createDbClient();
      expect(client).toBeDefined();
    }).not.toThrow();
  });
});
