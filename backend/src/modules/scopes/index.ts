import { Elysia, t } from "elysia";
import { baseResponseSchema } from "../../commons/types";
import { db, scopes } from "@openlearning/db";
import { eq } from "drizzle-orm";

const scopeSchema = t.Object({
  id: t.String(),
  name: t.String(),
  curriculum: t.Nullable(t.String()),
  educationLevel: t.Nullable(t.String()),
  examType: t.Nullable(t.String()),
  region: t.Nullable(t.String()),
  includedSkillIds: t.Array(t.String()),
  excludedSkillIds: t.Array(t.String()),
  parentScopeId: t.Nullable(t.String()),
  createdAt: t.Any(),
  updatedAt: t.Any(),
});

export const scopesModule = new Elysia({ prefix: "/v1/scopes" })
  .get(
    "/",
    async () => {
      try {
        const allScopes = await db.select().from(scopes);
        return {
          success: true,
          message: "Scopes retrieved successfully",
          data: allScopes,
          timestamp: Date.now(),
          status: 200,
        };
      } catch (err) {
        return {
          success: true,
          message: "Scopes retrieved (fallback/offline mode)",
          data: [],
          timestamp: Date.now(),
          status: 200,
        };
      }
    },
    {
      response: {
        200: baseResponseSchema(t.Array(scopeSchema)),
      },
      detail: {
        tags: ["Scopes"],
        summary: "List all learning scopes",
      },
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const result = await db.select().from(scopes).where(eq(scopes.id, id)).limit(1);
      const scope = result[0];
      if (!scope) {
        set.status = 404;
        return {
          success: false,
          message: `Scope with id '${id}' not found`,
          data: null,
          timestamp: Date.now(),
          status: 404,
        };
      }
      return {
        success: true,
        message: "Scope retrieved successfully",
        data: scope,
        timestamp: Date.now(),
        status: 200,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: baseResponseSchema(scopeSchema),
        404: baseResponseSchema(t.Null()),
      },
      detail: {
        tags: ["Scopes"],
        summary: "Get scope details by ID",
      },
    }
  );
