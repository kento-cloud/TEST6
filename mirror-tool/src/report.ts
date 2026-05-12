import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import type { MirrorResult } from "./types.js"
import type { DiffResult } from "./diff.js"

export function generateReport(
  result: MirrorResult,
  diffs: readonly DiffResult[],
  outputDir: string
): string {
  const reportsDir = join(outputDir, "reports")
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true })

  const now = new Date().toISOString()
  const duration = (result.stats.durationMs / 1000).toFixed(1)

  const lines: string[] = [
    "# Mirror Report",
    "",
    `> Generated: ${now}`,
    `> Duration: ${duration}s`,
    "",
    "## Summary",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total assets detected | ${result.stats.totalAssets} |`,
    `| Assets saved | ${result.stats.savedAssets} |`,
    `| Missing (404) assets | ${result.stats.missingAssets} |`,
    `| Total size | ${formatBytes(result.stats.totalSizeBytes)} |`,
    "",
    "## HTML Files",
    "",
    `| File | Description |`,
    `|------|-------------|`,
    `| \`${result.htmlFiles.rawRendered}\` | Playwright で取得した生の rendered HTML |`,
    `| \`${result.htmlFiles.domCleaned}\` | 不要要素を DOM API で削除した HTML |`,
    `| \`${result.htmlFiles.local}\` | URL をローカルパスに書き換えた HTML |`,
    "",
  ]

  if (diffs.length > 0) {
    lines.push(
      "## Screenshot Comparison",
      "",
      "| Viewport | Live Size | Local Size | Size Diff |",
      "|----------|-----------|------------|-----------|"
    )
    for (const d of diffs) {
      lines.push(
        `| ${d.name} | ${formatBytes(d.liveSizeBytes)} | ${formatBytes(d.localSizeBytes)} | ${d.sizeDiffPercent}% |`
      )
    }
    lines.push("")
  }

  if (result.screenshots.length > 0) {
    lines.push("## Screenshots", "")
    for (const ss of result.screenshots) {
      lines.push(`### ${ss.name} (${ss.viewport.width}x${ss.viewport.height})`)
      lines.push("")
      lines.push(`- Live: \`${ss.livePath}\``)
      lines.push(`- Local: \`${ss.localPath}\``)
      lines.push("")
    }
  }

  if (result.missingAssets.length > 0) {
    lines.push(
      "## Missing Assets (404)",
      "",
      "| URL | Status | Content-Type |",
      "|-----|--------|--------------|"
    )
    for (const m of result.missingAssets) {
      const shortUrl =
        m.url.length > 80 ? `${m.url.slice(0, 77)}...` : m.url
      lines.push(`| ${shortUrl} | ${m.status} | ${m.contentType} |`)
    }
    lines.push("")
  }

  const markdown = lines.join("\n")
  const reportPath = join(reportsDir, "mirror-report.md")
  writeFileSync(reportPath, markdown, "utf-8")
  console.log(`[report] Saved report to ${reportPath}`)

  return reportPath
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
