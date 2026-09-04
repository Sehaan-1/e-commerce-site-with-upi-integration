import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  databaseUrl
    ? globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      })
    : (undefined as unknown as Pool);

if (process.env.NODE_ENV !== "production") {
  if (databaseUrl) globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = databaseUrl
  ? drizzle(pool)
  : (new Proxy(
      {},
      {
        get() {
          throw new Error("DATABASE_URL is required");
        },
      },
    ) as unknown as ReturnType<typeof drizzle>);
