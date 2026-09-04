import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Use node environment for server/lib unit tests
    environment: "node",

    // Auto-import jest-dom matchers in every test file
    setupFiles: ["./src/test/setup.ts"],

    // Only run files in __tests__ directories or *.test.ts(x) files
    include: ["src/**/__tests__/**/*.{ts,tsx}", "src/**/*.test.{ts,tsx}"],

    // Exclude playwright E2E tests (those live in /e2e and use a different runner)
    exclude: ["node_modules", "e2e"],

    // Coverage via V8 (no Babel required)
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/lib/**"],
      exclude: ["src/lib/__tests__/**", "node_modules"],
    },

    globals: true,
  },
  resolve: {
    alias: {
      // Match the `@/*` path alias in tsconfig.json
      "@": path.resolve(__dirname, "./src"),
      // `server-only` is a Next.js package that throws at runtime if imported
      // on the client. In Vitest (Node), we stub it with an empty module.
      "server-only": path.resolve(__dirname, "./src/test/stubs/server-only.ts"),
      // Next.js navigation / headers APIs aren't available in Vitest — stubs
      // are provided via vi.mock() in each test file. These aliases prevent
      // Vite's import resolver from failing if the mocks aren't hoisted fast
      // enough during collection.
    },
  },
});
