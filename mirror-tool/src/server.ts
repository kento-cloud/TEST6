import http from "http"
import { readFileSync, existsSync, statSync } from "fs"
import { join, extname, resolve } from "path"
import { createMockHandler } from "./mock-routes.js"

const ROOT = resolve(import.meta.dirname, "..", "output")
const PORT = Number(process.env.PORT) || 8200

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".md": "text/markdown; charset=utf-8",
  ".map": "application/json",
}

function tryServe(filePath: string): Buffer | null {
  try {
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      return readFileSync(filePath)
    }
  } catch {
    // ignore
  }
  return null
}

// API モックハンドラー
const mockHandler = createMockHandler(ROOT)

const server = http.createServer((req, res) => {
  const fullUrl = req.url ?? "/"
  const rawPath = fullUrl.split("?")[0]
  const urlPath = decodeURIComponent(rawPath)

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    })
    res.end()
    return
  }

  // 1. API モック: /api/*, /connect/*, /_next/data/* (クエリパラメータ付きデータ)
  if (mockHandler && (
    urlPath.startsWith("/api/") ||
    urlPath.startsWith("/connect/") ||
    urlPath.startsWith("/_next/data/")
  )) {
    if (mockHandler(req, res, urlPath)) return
  }

  // 2. _next/static → output/assets/_next/static
  //    URL encoded filenames (%5B...%5D) need raw path
  if (urlPath.startsWith("/_next/") || rawPath.startsWith("/_next/")) {
    const candidates = [
      join(ROOT, "assets", urlPath),
      join(ROOT, "assets", rawPath),  // for %5B encoded filenames
    ]
    const assetPath = candidates.find((p) => tryServe(p) !== null) ?? candidates[0]
    const data = tryServe(assetPath)
    if (data) {
      const ext = extname(assetPath)
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      })
      res.end(data)
      return
    }
  }

  // 3. /images/ → output/assets/images/ (Next.js image optimization path)
  if (urlPath.startsWith("/images/") || urlPath.startsWith("/favicon/")) {
    const assetPath = join(ROOT, "assets", urlPath)
    const data = tryServe(assetPath)
    if (data) {
      const ext = extname(assetPath)
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" })
      res.end(data)
      return
    }
  }

  // 4. /assets/ → output/assets/assets/ (元サイトの /assets/ パス)
  //    also try output/assets/ for legacy
  if (urlPath.startsWith("/assets/")) {
    const candidates = [
      join(ROOT, "assets", urlPath),  // output/assets/assets/...
      join(ROOT, urlPath),            // output/assets/...
    ]
    for (const candidate of candidates) {
      const data = tryServe(candidate)
      if (data) {
        const ext = extname(candidate)
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" })
        res.end(data)
        return
      }
    }
  }

  // 5. ページ: output/pages/<path>/index.html
  const pageCandidates = [
    join(ROOT, "pages", urlPath, "index.html"),
    join(ROOT, "pages", `${urlPath}.html`),
    join(ROOT, "pages", urlPath),
  ]

  for (const candidate of pageCandidates) {
    const data = tryServe(candidate)
    if (data) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(data)
      return
    }
  }

  // 6. output 直下のファイル
  const directCandidates = [
    join(ROOT, urlPath),
    join(ROOT, `${urlPath}.html`),
    join(ROOT, urlPath, "index.html"),
  ]
  for (const candidate of directCandidates) {
    const data = tryServe(candidate)
    if (data) {
      const ext = extname(candidate)
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" })
      res.end(data)
      return
    }
  }

  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
  res.end("<h1>404 - Not Found</h1><p><a href='/'>Home</a></p>")
})

server.listen(PORT, () => {
  console.log(`[server] Mirror site: http://localhost:${PORT}`)
  console.log(`[server] Serving from: ${ROOT}`)
  console.log(`[server] API mock: ${mockHandler ? "enabled" : "disabled"}`)
  console.log("[server] Press Ctrl+C to stop")
})
