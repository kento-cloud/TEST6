import { readFileSync, writeFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

/**
 * JSチャンク内のAPIベースURLをローカルサーバーに書き換える。
 * css-localizer.ts と同じパターンで、Node.js側でファイルを読み書きする。
 */
export function rewriteJsApiUrls(
  assetsDir: string,
  localOrigin: string
): number {
  const jsFiles = findJsFiles(join(assetsDir, "_next"))
  let rewriteCount = 0

  const replacements: [string, string][] = [
    ["https://api.pivotmedia.co.jp", localOrigin],
    ["http://api.pivotmedia.co.jp", localOrigin],
    // _next/data のURL書き換え（Next.js SPA遷移用）
    ["https://pivotmedia.co.jp/_next/data", `${localOrigin}/_next/data`],
  ]

  for (const jsPath of jsFiles) {
    let content = readFileSync(jsPath, "utf-8")
    let changed = false

    for (const [from, to] of replacements) {
      if (content.includes(from)) {
        content = content.replaceAll(from, to)
        rewriteCount++
        changed = true
      }
    }

    if (changed) {
      writeFileSync(jsPath, content, "utf-8")
    }
  }

  console.log(`[js-rewriter] Rewrote ${rewriteCount} API URLs in ${jsFiles.length} JS files`)
  return rewriteCount
}

function findJsFiles(dir: string): string[] {
  const results: string[] = []
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return results

  function walk(d: string): void {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        walk(full)
      } else if (entry.endsWith(".js")) {
        results.push(full)
      }
    }
  }

  walk(dir)
  return results
}
