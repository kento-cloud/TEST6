import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import type { Page } from "playwright"

export interface ApiRecord {
  readonly url: string
  readonly method: string
  readonly status: number
  readonly contentType: string
  readonly responseBody: string
  readonly isBase64: boolean
}

const API_PATTERNS = [
  "api.pivotmedia.co.jp/api/",
  "api.pivotmedia.co.jp/connect/",
  "pivotmedia.co.jp/_next/data/",
  "api.iconify.design/",
]

export function createApiRecorder(page: Page) {
  const records = new Map<string, ApiRecord>()

  page.on("response", async (resp) => {
    try {
      const url = resp.url()
      const isApi = API_PATTERNS.some((p) => url.includes(p))
      if (!isApi) return

      const status = resp.status()
      if (status >= 400) return

      const method = resp.request().method()
      const ct = resp.headers()["content-type"] ?? ""
      const key = `${method}:${new URL(url).pathname}${new URL(url).search}`

      if (records.has(key)) return

      const body = await resp.body().catch(() => null)
      if (!body) return

      const isBinary = ct.includes("proto") || ct.includes("octet-stream")
      records.set(key, {
        url,
        method,
        status,
        contentType: ct,
        responseBody: isBinary ? body.toString("base64") : body.toString("utf-8"),
        isBase64: isBinary,
      })
    } catch {
      // ignore
    }
  })

  return {
    getRecords: () => [...records.values()],
    save: (outputDir: string) => {
      const apiDir = join(outputDir, "api-responses")
      if (!existsSync(apiDir)) mkdirSync(apiDir, { recursive: true })

      const manifest: { key: string; file: string; url: string; method: string; contentType: string }[] = []

      for (const [key, record] of records) {
        const safeName = key
          .replace(/[^a-zA-Z0-9_\-]/g, "_")
          .slice(0, 200)
        const fileName = `${safeName}.json`
        const filePath = join(apiDir, fileName)

        writeFileSync(filePath, JSON.stringify(record, null, 2), "utf-8")
        manifest.push({
          key,
          file: fileName,
          url: record.url,
          method: record.method,
          contentType: record.contentType,
        })
      }

      writeFileSync(
        join(outputDir, "api-manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf-8"
      )

      console.log(`[api-recorder] Saved ${records.size} API responses`)
      return manifest
    },
  }
}
