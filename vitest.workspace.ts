import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "core",
      environment: "node",
      include: ["packages/core/test/**/*.test.ts"],
    },
  },
  {
    test: {
      name: "web",
      environment: "jsdom",
      include: ["packages/web/test/**/*.test.{ts,tsx}"],
      setupFiles: ["./packages/web/test/setup.ts"],
    },
  },
]);
