import { join } from "path"
import type { Page } from "playwright"
import type { MirrorConfig, ScreenshotPair, Viewport } from "./types.js"

/**
 * 実サイトのスクリーンショットを各 viewport で撮影する
 */
export async function captureLiveScreenshots(
  page: Page,
  config: MirrorConfig,
  outputDir: string
): Promise<ScreenshotPair[]> {
  const screenshotsDir = join(outputDir, "screenshots")
  const pairs: ScreenshotPair[] = []

  for (const vp of config.viewports) {
    console.log(`[screenshot] Capturing live ${vp.name} (${vp.width}x${vp.height})...`)
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.waitForTimeout(1500)

    const livePath = join(screenshotsDir, `live-${vp.name}.png`)
    await page.screenshot({ path: livePath, fullPage: true })

    pairs.push({
      name: vp.name,
      viewport: vp,
      livePath,
      localPath: join(screenshotsDir, `local-${vp.name}.png`),
    })
  }

  console.log(`[screenshot] Captured ${pairs.length} live screenshots`)
  return pairs
}

/**
 * ローカルサーバー経由でスクリーンショットを撮影する
 */
export async function captureLocalScreenshots(
  page: Page,
  localUrl: string,
  screenshots: readonly ScreenshotPair[]
): Promise<void> {
  console.log(`[screenshot] Navigating to local: ${localUrl}`)
  await page.goto(localUrl, { waitUntil: "networkidle", timeout: 30_000 })
  await page.waitForTimeout(2000)

  for (const ss of screenshots) {
    console.log(`[screenshot] Capturing local ${ss.name} (${ss.viewport.width}x${ss.viewport.height})...`)
    await page.setViewportSize({
      width: ss.viewport.width,
      height: ss.viewport.height,
    })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: ss.localPath, fullPage: true })
  }

  console.log(`[screenshot] Captured ${screenshots.length} local screenshots`)
}

/**
 * viewport をデフォルトに戻す
 */
export async function resetViewport(
  page: Page,
  viewport: Viewport
): Promise<void> {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  })
}
