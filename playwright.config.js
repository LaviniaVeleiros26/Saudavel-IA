const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: process.env.AUTH_TEST_CONFIG === "invalid-url" ? "**/invalid-config.spec.js" : "**/auth.spec.js",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: process.env.AUTH_TEST_MODE === "production"
      ? "npm run build && npm run start -- --hostname 127.0.0.1 --port 3100"
      : "npm run dev -- --hostname 127.0.0.1 --port 3100",
    timeout: 120000,
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: false,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_SUPABASE_URL: process.env.AUTH_TEST_CONFIG === "invalid-url"
        ? "NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co"
        : "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.AUTH_TEST_KEY_TYPE === "anon" ? "public-test-key" : "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.AUTH_TEST_KEY_TYPE === "anon" ? "" : "sb_publishable_test-key",
    },
  },
});
