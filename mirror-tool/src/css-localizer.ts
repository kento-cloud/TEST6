import { readFileSync, writeFileSync, readdirSync, statSync } from "fs"
import { join, relative, dirname } from "path"

/**
 * CSS ファイル内の url() 参照をローカルパスに書き換える。
 * assets ディレクトリ内の .css ファイルを走査して処理する。
 */
export function localizeCssUrls(
  assetsDir: string,
  siteOrigin: string
): number {
  const cssFiles = findCssFiles(assetsDir)
  let rewriteCount = 0

  for (const cssPath of cssFiles) {
    const content = readFileSync(cssPath, "utf-8")
    const cssDir = dirname(cssPath)

    const rewritten = content.replace(
      /url\(["']?(https?:\/\/[^"')]+)["']?\)/g,
      (_match, rawUrl: string) => {
        rewriteCount++
        const localAssetPath = urlToAssetPath(rawUrl, siteOrigin)
        const fullLocalPath = join(assetsDir, localAssetPath)
        const rel = relative(cssDir, fullLocalPath)
        return `url("${rel}")`
      }
    )

    if (rewritten !== content) {
      writeFileSync(cssPath, rewritten, "utf-8")
    }
  }

  console.log(`[css-localizer] Rewrote ${rewriteCount} url() references in ${cssFiles.length} CSS files`)
  return rewriteCount
}

function findCssFiles(dir: string): string[] {
  const results: string[] = []

  function walk(d: string): void {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        walk(full)
      } else if (entry.endsWith(".css")) {
        results.push(full)
      }
    }
  }

  walk(dir)
  return results
}

function urlToAssetPath(url: string, siteOrigin: string): string {
  try {
    const u = new URL(url)
    if (u.origin === siteOrigin) {
      return u.pathname.replace(/^\//, "") || "index"
    }
    return `_external/${u.hostname}${u.pathname}`
  } catch {
    return `_unknown/${encodeURIComponent(url)}`
  }
}
