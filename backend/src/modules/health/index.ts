import { Elysia, t } from "elysia";
import { baseResponseSchema } from "../../commons/types";
import { getEnv } from "@openlearning/config";

export const healthModule = new Elysia({ prefix: "/health" }).get(
  "/",
  () => {
    const env = getEnv();
    return {
      success: true,
      message: "System is healthy",
      data: {
        status: "ok",
        environment: env.NODE_ENV,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
      status: 200,
    };
  },
  {
    response: {
      200: baseResponseSchema(
        t.Object({
          status: t.String(),
          environment: t.String(),
          uptimeSeconds: t.Number(),
          timestamp: t.String(),
        })
      ),
    },
    detail: {
      tags: ["Health"],
      summary: "System Health Check",
      description: "Returns health status of the application API.",
    },
  }
);
