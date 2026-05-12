import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join, resolve } from "path"
import { DEFAULT_CONFIG, type MirrorResult, type MirrorStats, type ScreenshotPair } from "./types.js"
import { launchBrowser, navigateAndLoad, closeBrowser } from "./crawler.js"
import { createAssetRecorderWithSave } from "./asset-recorder.js"
import { createApiRecorder } from "./api-recorder.js"
import { localizeCssUrls } from "./css-localizer.js"
import { rewriteJsApiUrls } from "./js-rewriter.js"
import { captureLocalScreenshots } from "./screenshot.js"
import { compareScreenshots } from "./diff.js"
import { generateReport } from "./report.js"
import { crawlMultiPage } from "./multi-crawl.js"
import { generateLinkReport } from "./link-report.js"

async function main(): Promise<void> {
  const startTime = Date.now()
  const config = DEFAULT_CONFIG
  const outputDir = resolve(import.meta.dirname, "..", config.outputDir)
  const siteOrigin = new URL(config.targetUrl).origin

  // Ensure output directories exist
  for (const sub of ["assets", "screenshots", "reports", "pages"]) {
    const dir = join(outputDir, sub)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }

  console.log("=== Mirror Tool ===")
  console.log(`Target: ${config.targetUrl}`)
  console.log(`Output: ${outputDir}`)
  console.log()

  // 1. Launch browser & set up recorders
  const ctx = await launchBrowser(config)
  const recorder = createAssetRecorderWithSave(ctx.page, siteOrigin, outputDir)
  const apiRecorder = createApiRecorder(ctx.page)

  // 2. Multi-page crawl (BFS, depth 2)
  //    - ホームページ含む全ページをクロール
  //    - 各ページの HTML を pages/<path>/index.html に保存
  //    - <a> リンクをローカルパスまたは元サイト URL に書き換え
  const crawlResult = await crawlMultiPage(ctx.page, config, siteOrigin, outputDir)

  // 3. ホームページに戻ってスクリーンショット撮影
  console.log("\n[screenshot] Taking live screenshots...")
  await ctx.page.goto(config.targetUrl, { waitUntil: "networkidle", timeout: 60_000 })
  await ctx.page.waitForTimeout(2000)

  const screenshotsDir = join(outputDir, "screenshots")
  await ctx.page.screenshot({
    path: join(screenshotsDir, "live-pc.png"),
    fullPage: true,
  })

  // Save raw rendered HTML
  console.log("\n[html] Saving raw-rendered.html...")
  const rawHtml = await ctx.page.content()
  writeFileSync(join(outputDir, "raw-rendered.html"), `<!DOCTYPE html>\n${rawHtml}`, "utf-8")

  // SP screenshot
  await ctx.page.setViewportSize({
    width: config.viewports[1].width,
    height: config.viewports[1].height,
  })
  await ctx.page.waitForTimeout(2000)
  await ctx.page.screenshot({
    path: join(screenshotsDir, "live-sp.png"),
    fullPage: true,
  })

  const screenshots = config.viewports.map((vp) => ({
    name: vp.name,
    viewport: vp,
    livePath: join(screenshotsDir, `live-${vp.name}.png`),
    localPath: join(screenshotsDir, `local-${vp.name}.png`),
  }))

  // 4. Save assets & generate manifest
  console.log("\n[assets] Saving assets...")
  const { manifest, missing } = recorder.save()

  writeFileSync(
    join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  )
  writeFileSync(
    join(outputDir, "missing-assets.json"),
    JSON.stringify(missing, null, 2),
    "utf-8"
  )

  // 5. Save API responses
  console.log("\n[api] Saving API responses...")
  apiRecorder.save(outputDir)

  // 5.5. Fix empty _next/data responses
  console.log("\n[data-fixer] Fixing _next/data responses...")
  const { fixNextDataResponses } = await import("./data-fixer.js")
  // ホームページに戻って本家から正しいデータを取得
  await ctx.page.goto(config.targetUrl, { waitUntil: "networkidle", timeout: 60_000 })
  await fixNextDataResponses(ctx.page, siteOrigin, outputDir)

  // 6. Localize CSS url() references
  console.log("\n[css] Localizing CSS urls...")
  localizeCssUrls(join(outputDir, "assets"), siteOrigin)

  // 7. Rewrite JS API URLs to point to local server
  console.log("\n[js] Rewriting API URLs in JS chunks...")
  rewriteJsApiUrls(join(outputDir, "assets"), `http://localhost:${8200}`)

  // 8. Link report
  console.log("\n[link-report] Generating link report...")
  generateLinkReport(crawlResult.pages, outputDir)

  // 7. Take local screenshots via temp server
  console.log("\n[screenshot] Taking local screenshots...")
  try {
    await captureLocalWithTempServer(ctx, outputDir, screenshots)
  } catch (error) {
    console.warn("[screenshot] Local screenshot capture failed:", error)
  }

  // 8. Compare screenshots
  const diffs = compareScreenshots(screenshots)

  // 9. Build result
  const stats: MirrorStats = {
    totalAssets: manifest.length + missing.length,
    savedAssets: manifest.length,
    missingAssets: missing.length,
    totalSizeBytes: manifest.reduce((sum, m) => sum + m.size, 0),
    durationMs: Date.now() - startTime,
  }

  const result: MirrorResult = {
    manifest,
    missingAssets: missing,
    screenshots,
    htmlFiles: {
      rawRendered: "raw-rendered.html",
      domCleaned: "dom-cleaned.html",
      local: "local.html",
    },
    stats,
  }

  // 10. Generate mirror report
  console.log("\n[report] Generating mirror report...")
  generateReport(result, diffs, outputDir)

  // Cleanup
  await closeBrowser(ctx)

  console.log("\n=== Done ===")
  console.log(`Pages: ${crawlResult.pages.length} crawled`)
  console.log(`Assets: ${stats.savedAssets} saved, ${stats.missingAssets} missing`)
  console.log(`Size: ${(stats.totalSizeBytes / 1024 / 1024).toFixed(1)} MB`)
  console.log(`Time: ${(stats.durationMs / 1000).toFixed(1)}s`)
  console.log(`\nRun \`npm run serve\` to view locally at http://localhost:8200`)
}

/**
 * 一時的にローカルサーバーを立ち上げてスクリーンショットを撮る
 */
async function captureLocalWithTempServer(
  ctx: Awaited<ReturnType<typeof launchBrowser>>,
  outputDir: string,
  screenshots: readonly ScreenshotPair[]
): Promise<void> {
  const http = await import("http")
  const { readFileSync, existsSync: exists, statSync: stat } = await import("fs")
  const { join: joinPath, extname: ext } = await import("path")

  const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".gif": "image/gif",
    ".avif": "image/avif",
    ".ttf": "font/ttf",
  }

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0])
    // pages ルーティング
    const candidates = [
      joinPath(outputDir, "pages", urlPath, "index.html"),
      joinPath(outputDir, "pages", urlPath + ".html"),
      joinPath(outputDir, urlPath),
    ]
    if (urlPath === "/") {
      candidates.unshift(joinPath(outputDir, "pages", "index.html"))
    }

    for (const filePath of candidates) {
      if (exists(filePath) && stat(filePath).isFile()) {
        const mime = MIME[ext(filePath)] ?? "application/octet-stream"
        res.writeHead(200, { "Content-Type": mime })
        res.end(readFileSync(filePath))
        return
      }
    }
    res.writeHead(404)
    res.end("Not found")
  })

  const port = 18200
  await new Promise<void>((resolve) => server.listen(port, resolve))

  try {
    const page = await ctx.context.newPage()
    await captureLocalScreenshots(page, `http://localhost:${port}`, screenshots)
    await page.close()
  } finally {
    server.close()
  }
}

main().catch((err) => {
  console.error("Mirror failed:", err)
  process.exit(1)
})
