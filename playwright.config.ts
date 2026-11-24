import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  webServer: {
    command: "node e2e/start-server.mjs",
    url: "http://127.0.0.1:55436/api/ready",
    reuseExistingServer: false,
  },
  use: {
    baseURL: "http://127.0.0.1:55436",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
