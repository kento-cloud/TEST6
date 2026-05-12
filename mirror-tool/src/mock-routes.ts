import { readFileSync, existsSync } from "fs"
import { join } from "path"
import type { IncomingMessage, ServerResponse } from "http"

interface ApiManifestEntry {
  key: string
  file: string
  url: string
  method: string
  contentType: string
}

interface MockConfig {
  outputDir: string
  manifest: ApiManifestEntry[]
}

export function createMockHandler(outputDir: string) {
  const manifestPath = join(outputDir, "api-manifest.json")
  if (!existsSync(manifestPath)) {
    console.warn("[mock] api-manifest.json not found, API mocking disabled")
    return null
  }

  const manifest: ApiManifestEntry[] = JSON.parse(
    readFileSync(manifestPath, "utf-8")
  )

  // URL → ファイル名のマップ構築
  const routeMap = new Map<string, { file: string; contentType: string }>()
  for (const entry of manifest) {
    const parsed = new URL(entry.url)
    const routeKey = `${entry.method}:${parsed.pathname}${parsed.search}`
    routeMap.set(routeKey, {
      file: entry.file,
      contentType: entry.contentType,
    })
  }

  console.log(`[mock] Loaded ${routeMap.size} API routes`)

  return function handleMock(
    req: IncomingMessage,
    res: ServerResponse,
    urlPath: string
  ): boolean {
    const method = req.method ?? "GET"
    const search = (req.url ?? "").split("?")[1] ?? ""
    const routeKey = `${method}:${urlPath}${search ? "?" + search : ""}`

    // 完全一致を試行
    let match = routeMap.get(routeKey)

    // クエリなしでも試行
    if (!match) {
      match = routeMap.get(`${method}:${urlPath}`)
    }

    // POST のパスマッチ (gRPC-Connect)
    if (!match && method === "POST") {
      for (const [key, val] of routeMap) {
        if (key.startsWith("POST:") && key.includes(urlPath)) {
          match = val
          break
        }
      }
    }

    if (!match) return false

    const filePath = join(outputDir, "api-responses", match.file)
    if (!existsSync(filePath)) return false

    try {
      const record = JSON.parse(readFileSync(filePath, "utf-8"))
      const body = record.isBase64
        ? Buffer.from(record.responseBody, "base64")
        : Buffer.from(record.responseBody, "utf-8")

      res.writeHead(record.status || 200, {
        "Content-Type": match.contentType || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      })
      res.end(body)
      return true
    } catch {
      return false
    }
  }
}
