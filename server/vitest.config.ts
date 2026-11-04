import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup-database.ts"],
    exclude: ["tests/unit/**", "node_modules/**"],
    fileParallelism: false,
  },
});
