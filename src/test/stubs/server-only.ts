/**
 * Stub for the `server-only` package in test environments.
 *
 * The real `server-only` package (provided by Next.js) throws an error when
 * imported outside a Next.js server context. In Vitest, we replace it with
 * this no-op stub via the `resolve.alias` in vitest.config.ts so that modules
 * using `import "server-only"` can be tested in isolation.
 */
export {};
