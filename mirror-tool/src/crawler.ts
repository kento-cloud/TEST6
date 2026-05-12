import { chromium, type Browser, type BrowserContext, type Page } from "playwright"
import type { MirrorConfig } from "./types.js"

export interface CrawlContext {
  readonly browser: Browser
  readonly context: BrowserContext
  readonly page: Page
}

export async function launchBrowser(config: MirrorConfig): Promise<CrawlContext> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: {
      width: config.viewports[0].width,
      height: config.viewports[0].height,
    },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  })
  const page = await context.newPage()
  return { browser, context, page }
}

export async function navigateAndLoad(
  page: Page,
  config: MirrorConfig
): Promise<void> {
  console.log(`[crawler] Navigating to ${config.targetUrl}`)
  await page.goto(config.targetUrl, {
    waitUntil: "networkidle",
    timeout: config.networkIdleTimeoutMs,
  })

  console.log("[crawler] Waiting for initial render...")
  await page.waitForTimeout(3000)

  console.log("[crawler] Scrolling to trigger lazy loads...")
  await page.evaluate(`(async () => {
    const delayMs = ${config.scrollDelayMs};
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const scrollHeight = document.documentElement.scrollHeight;
    const step = window.innerHeight;
    for (let y = 0; y < scrollHeight; y += step) {
      window.scrollTo(0, y);
      await delay(delayMs);
    }
    window.scrollTo(0, 0);
  })()`)

  await page.waitForTimeout(2000)
  console.log("[crawler] Page fully loaded")
}

export async function closeBrowser(ctx: CrawlContext): Promise<void> {
  await ctx.browser.close()
}
