import { writeFileSync, readFileSync } from "fs"
import { join } from "path"
import type { Page } from "playwright"

/**
 * Playwright のクロール中にキャプチャされた _next/data JSON のうち
 * 空レスポンスのものを、本家サイトから直接再取得して修正する。
 *
 * Next.js の getServerSideProps はブラウザからの _next/data リクエストに
 * クエリパラメータ付きで応答するが、Playwright のページ遷移では
 * これらがSPAクライアント側で取得されるため空になることがある。
 */
export async function fixNextDataResponses(
  page: Page,
  siteOrigin: string,
  outputDir: string
): Promise<number> {
  const manifestPath = join(outputDir, "api-manifest.json")
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"))
  const apiDir = join(outputDir, "api-responses")

  // buildId を __NEXT_DATA__ から取得
  let buildId: string | null = null
  try {
    const indexHtml = readFileSync(join(outputDir, "pages", "index.html"), "utf-8")
    const match = indexHtml.match(/"buildId":"([^"]+)"/)
    if (match) buildId = match[1]
  } catch {
    // fallback
  }

  if (!buildId) {
    console.warn("[data-fixer] Could not find buildId")
    return 0
  }

  // 修正が必要な _next/data エンドポイントを特定
  const baseUrl = `${siteOrigin}/_next/data/${buildId}`
  const toFix: { key: string; url: string; file: string }[] = []

  for (const entry of manifest) {
    if (!entry.key.includes("/_next/data/")) continue

    const filePath = join(apiDir, entry.file)
    try {
      const record = JSON.parse(readFileSync(filePath, "utf-8"))
      const body = record.responseBody
      // 空 or HTML（エラーページ）が返されているエントリを修正対象に
      if (body === "{}" || body.startsWith("<!DOCTYPE") || body.startsWith("<html")) {
        toFix.push({ key: entry.key, url: entry.url, file: entry.file })
      }
    } catch {
      // skip
    }
  }

  // 追加で必要なエンドポイント
  const extraEndpoints = [
    "/category.json?category_code=business",
    "/category.json?category_code=money",
    "/category.json?category_code=career",
    "/category.json?category_code=life",
    "/category.json?category_code=technology",
    "/category.json?category_code=global",
    "/search.json",
    "/mylist.json",
    "/action.json",
    "/account.json",
    "/index.json",
    "/new_arrival/episode.json",
    "/program/list.json",
    "/playlist/staff/recommend.json",
  ]

  for (const ep of extraEndpoints) {
    const key = `GET:/_next/data/${buildId}${ep}`
    if (!toFix.find((f) => f.key === key) && !manifest.find((e: { key: string }) => e.key === key && !toFix.find((f) => f.key === key))) {
      const safeName = key.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 200) + ".json"
      toFix.push({ key, url: baseUrl + ep, file: safeName })
    }
  }

  let fixCount = 0
  for (const item of toFix) {
    try {
      const resp = await page.evaluate(`fetch(${JSON.stringify(item.url)}).then(r => r.text())`)
      if (typeof resp !== "string" || resp.length === 0) continue

      const record = {
        url: item.url,
        method: "GET",
        status: 200,
        contentType: "application/json",
        responseBody: resp,
        isBase64: false,
      }
      writeFileSync(join(apiDir, item.file), JSON.stringify(record, null, 2), "utf-8")

      // マニフェストに追加/更新
      const existing = manifest.find((e: { key: string }) => e.key === item.key)
      if (!existing) {
        manifest.push({
          key: item.key,
          file: item.file,
          url: item.url,
          method: "GET",
          contentType: "application/json",
        })
      }

      fixCount++
    } catch (error) {
      console.warn(`[data-fixer] Failed to fix ${item.key}:`, error)
    }
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8")
  console.log(`[data-fixer] Fixed ${fixCount} _next/data responses`)
  return fixCount
}
