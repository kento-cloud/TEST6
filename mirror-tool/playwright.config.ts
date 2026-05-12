import { defineConfig } from "playwright/test"

export default defineConfig({
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  },
  timeout: 120_000,
})
