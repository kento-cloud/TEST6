import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import type { RawLink } from "./link-collector.js"

export interface PageLinkData {
  readonly pagePath: string
  readonly depth: number
  readonly links: readonly RawLink[]
  readonly rewrittenLinks: readonly RewrittenLink[]
}

export interface RewrittenLink {
  readonly originalHref: string
  readonly newHref: string
  readonly isInternal: boolean
  readonly isCrawled: boolean
  readonly text: string
}

export function generateLinkReport(
  pages: readonly PageLinkData[],
  outputDir: string
): string {
  const reportsDir = join(outputDir, "reports")
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true })

  const allLinks = pages.flatMap((p) => p.links)
  const allRewritten = pages.flatMap((p) => p.rewrittenLinks)
  const internalLinks = allLinks.filter((l) => l.isInternal)
  const externalLinks = allLinks.filter((l) => !l.isInternal)
  const crawledLinks = allRewritten.filter((l) => l.isInternal && l.isCrawled)
  const uncrawledInternal = allRewritten.filter((l) => l.isInternal && !l.isCrawled)

  const lines: string[] = [
    "# Link Report",
    "",
    `> Generated: ${new Date().toISOString()}`,
    `> Pages crawled: ${pages.length}`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Total links | ${allLinks.length} |`,
    `| Internal links | ${internalLinks.length} |`,
    `| External links | ${externalLinks.length} |`,
    `| Locally resolved | ${crawledLinks.length} |`,
    `| Uncrawled internal | ${uncrawledInternal.length} |`,
    "",
  ]

  // Per-page breakdown
  for (const page of pages) {
    lines.push(`## ${page.pagePath} (depth: ${page.depth})`, "")
    for (const rl of page.rewrittenLinks) {
      const icon = !rl.isInternal ? "[-]" : rl.isCrawled ? "[x]" : "[ ]"
      const label = rl.text ? ` "${rl.text}"` : ""
      lines.push(`- ${icon} \`${rl.originalHref}\` → \`${rl.newHref}\`${label}`)
    }
    lines.push("")
  }

  // External links
  if (externalLinks.length > 0) {
    const uniqueExternal = [
      ...new Map(externalLinks.map((l) => [l.resolvedUrl, l])).values(),
    ]
    lines.push("## External Links", "", "| URL | Text |", "|-----|------|")
    for (const el of uniqueExternal) {
      const shortUrl = el.resolvedUrl.length > 80 ? `${el.resolvedUrl.slice(0, 77)}...` : el.resolvedUrl
      lines.push(`| ${shortUrl} | ${el.text.slice(0, 40)} |`)
    }
    lines.push("")
  }

  // Uncrawled internal
  if (uncrawledInternal.length > 0) {
    const uniqueUncrawled = [
      ...new Map(uncrawledInternal.map((l) => [l.originalHref, l])).values(),
    ]
    lines.push("## Uncrawled Internal Links", "", "| Original | Fallback |", "|----------|----------|")
    for (const ul of uniqueUncrawled) {
      lines.push(`| ${ul.originalHref} | ${ul.newHref} |`)
    }
    lines.push("")
  }

  const md = lines.join("\n")
  const reportPath = join(reportsDir, "link-report.md")
  writeFileSync(reportPath, md, "utf-8")
  console.log(`[link-report] Saved to ${reportPath}`)
  return reportPath
}
