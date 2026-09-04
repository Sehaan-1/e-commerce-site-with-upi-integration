import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Load environment variables so this config works in all environments
// (local dev, Docker, CI, production) without hardcoding credentials.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set.\n" +
      "Copy .env.example to .env and fill in your database connection string."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  // Verbose output for migrations in CI/CD
  verbose: true,
  strict: true,
});
