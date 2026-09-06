import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { getEnv } from "@openlearning/config";

let pool: Pool | null = null;

export function getPgPool(): Pool {
  if (!pool) {
    const env = getEnv();
    pool = new Pool({
      connectionString: env.DATABASE_URL,
    });
  }
  return pool;
}

export function createDbClient(customPool?: Pool) {
  const p = customPool || getPgPool();
  return drizzle({ client: p, schema });
}

export type DbClient = ReturnType<typeof createDbClient>;

export const db = createDbClient();
