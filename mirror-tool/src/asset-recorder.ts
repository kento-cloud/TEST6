import { createHash } from "crypto"
import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import type { Page } from "playwright"
import type { AssetRecord, ManifestEntry, MissingAsset } from "./types.js"

const ASSET_PATTERN =
  /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|css|js|json|mp4|webm|avif)(\?|$)/i

const ASSET_CONTENT_TYPES = [
  "image/",
  "font/",
  "text/css",
  "application/javascript",
  "application/json",
  "video/",
  "image/svg+xml",
]

export interface RecordedAssets {
  readonly assets: readonly AssetRecord[]
  readonly missing: readonly MissingAsset[]
}

export function createAssetRecorder(
  page: Page,
  siteOrigin: string
): { getResults: () => RecordedAssets } {
  const assets = new Map<string, AssetRecord>()
  const missing: MissingAsset[] = []
  const buffers = new Map<string, Buffer>()

  page.on("response", async (resp) => {
    try {
      const url = resp.url()
      const status = resp.status()
      const ct = resp.headers()["content-type"] ?? ""
      const isAsset =
        ASSET_PATTERN.test(url) ||
        ASSET_CONTENT_TYPES.some((t) => ct.includes(t))

      if (!isAsset) return

      if (status >= 400) {
        missing.push({
          url,
          status,
          referrer: resp.request().headers()["referer"] ?? "",
          contentType: ct,
        })
        return
      }

      if (assets.has(url)) return

      const body = await resp.body().catch(() => null)
      if (!body) return

      const localPath = urlToLocalPath(url, siteOrigin)
      assets.set(url, {
        url,
        localPath,
        contentType: ct,
        status,
        size: body.length,
      })
      buffers.set(url, body)
    } catch {
      // ignore network errors
    }
  })

  return {
    getResults: () => ({ assets: [...assets.values()], missing }),
  }
}

export function saveAssets(
  assets: readonly AssetRecord[],
  buffers: Map<string, Buffer>,
  outputDir: string
): void {
  const assetsDir = join(outputDir, "assets")
  let count = 0

  for (const asset of assets) {
    const buf = buffers.get(asset.url)
    if (!buf) continue

    const outPath = join(assetsDir, asset.localPath)
    const dir = dirname(outPath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(outPath, buf)
    count++
  }

  console.log(`[asset-recorder] Saved ${count} assets`)
}

export function createAssetRecorderWithSave(
  page: Page,
  siteOrigin: string,
  outputDir: string
): {
  getResults: () => RecordedAssets
  save: () => { manifest: ManifestEntry[]; missing: MissingAsset[] }
} {
  const assets = new Map<string, AssetRecord>()
  const missing: MissingAsset[] = []
  const buffers = new Map<string, Buffer>()

  page.on("response", async (resp) => {
    try {
      const url = resp.url()
      const status = resp.status()
      const ct = resp.headers()["content-type"] ?? ""
      const isAsset =
        ASSET_PATTERN.test(url) ||
        ASSET_CONTENT_TYPES.some((t) => ct.includes(t))

      if (!isAsset) return

      if (status >= 400) {
        missing.push({
          url,
          status,
          referrer: resp.request().headers()["referer"] ?? "",
          contentType: ct,
        })
        return
      }

      if (assets.has(url)) return

      const body = await resp.body().catch(() => null)
      if (!body) return

      const localPath = urlToLocalPath(url, siteOrigin)
      assets.set(url, {
        url,
        localPath,
        contentType: ct,
        status,
        size: body.length,
      })
      buffers.set(url, body)
    } catch {
      // ignore network errors
    }
  })

  return {
    getResults: () => ({ assets: [...assets.values()], missing }),
    save: () => {
      const assetsDir = join(outputDir, "assets")
      const manifest: ManifestEntry[] = []

      for (const asset of assets.values()) {
        const buf = buffers.get(asset.url)
        if (!buf) continue

        const outPath = join(assetsDir, asset.localPath)
        const dir = dirname(outPath)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        writeFileSync(outPath, buf)

        manifest.push({
          url: asset.url,
          localPath: asset.localPath,
          contentType: asset.contentType,
          size: asset.size,
          hash: createHash("sha256").update(buf).digest("hex").slice(0, 16),
        })
      }

      console.log(`[asset-recorder] Saved ${manifest.length} assets`)
      return { manifest, missing: [...missing] }
    },
  }
}

function urlToLocalPath(url: string, siteOrigin: string): string {
  try {
    const u = new URL(url)
    let path: string
    if (u.origin === siteOrigin) {
      path = u.pathname.replace(/^\//, "")
    } else {
      path = `_external/${u.hostname}${u.pathname}`
    }
    // パスが空またはスラッシュで終わる場合はファイル名を付与
    if (!path || path.endsWith("/")) {
      path += "index"
    }
    return path
  } catch {
    return `_unknown/${encodeURIComponent(url)}`
  }
}
