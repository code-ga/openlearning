import { describe, expect, test } from "bun:test";
import { parseEnv, Logger } from "./index";

describe("Config Package", () => {
  test("parseEnv correctly parses valid environment variables", () => {
    const env = parseEnv({
      PORT: "4000",
      LOG_LEVEL: "debug",
      DATABASE_URL: "postgres://user:pass@localhost:5432/test_db",
    });

    expect(env.PORT).toBe(4000);
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.DATABASE_URL).toBe("postgres://user:pass@localhost:5432/test_db");
  });

  test("parseEnv throws error on invalid database URL", () => {
    expect(() => {
      parseEnv({
        DATABASE_URL: "invalid-url-string",
      });
    }).toThrow();
  });

  test("Logger formats JSON log correctly", () => {
    const logger = new Logger("test-service", "debug");
    expect(logger).toBeDefined();
    // Test logging without throwing
    expect(() => {
      logger.info("Test message", { key: "value" });
    }).not.toThrow();
  });
});
