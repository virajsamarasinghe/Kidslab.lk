import { defineConfig } from "vitest/config";

/**
 * Unit tests for the security-critical pure logic — roles, password policy and
 * TOTP. Deliberately no jsdom or component rendering: those need a React
 * plugin whose Babel peers conflict with the current tree, and the value here
 * is in the authorisation rules, not the markup.
 *
 * `.mts` so Vite loads it as ESM natively, and `resolve.tsconfigPaths` in
 * place of `vite-tsconfig-paths`, which Vite now supersedes.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
