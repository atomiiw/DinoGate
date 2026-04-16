// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "file://" + __dirname,
    viewport: { width: 800, height: 600 },
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
