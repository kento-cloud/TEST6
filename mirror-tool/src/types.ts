export interface MirrorConfig {
  readonly targetUrl: string
  readonly outputDir: string
  readonly viewports: readonly Viewport[]
  readonly scrollDelayMs: number
  readonly networkIdleTimeoutMs: number
}

export interface Viewport {
  readonly name: string
  readonly width: number
  readonly height: number
}

export interface AssetRecord {
  readonly url: string
  readonly localPath: string
  readonly contentType: string
  readonly status: number
  readonly size: number
}

export interface ManifestEntry {
  readonly url: string
  readonly localPath: string
  readonly contentType: string
  readonly size: number
  readonly hash: string
}

export interface MissingAsset {
  readonly url: string
  readonly status: number
  readonly referrer: string
  readonly contentType: string
}

export interface ScreenshotPair {
  readonly name: string
  readonly viewport: Viewport
  readonly livePath: string
  readonly localPath: string
}

export interface MirrorResult {
  readonly manifest: readonly ManifestEntry[]
  readonly missingAssets: readonly MissingAsset[]
  readonly screenshots: readonly ScreenshotPair[]
  readonly htmlFiles: {
    readonly rawRendered: string
    readonly domCleaned: string
    readonly local: string
  }
  readonly stats: MirrorStats
}

export interface MirrorStats {
  readonly totalAssets: number
  readonly savedAssets: number
  readonly missingAssets: number
  readonly totalSizeBytes: number
  readonly durationMs: number
}

export const DEFAULT_CONFIG: MirrorConfig = {
  targetUrl: "https://pivotmedia.co.jp/",
  outputDir: "output",
  viewports: [
    { name: "pc", width: 1440, height: 900 },
    { name: "sp", width: 390, height: 844 },
  ],
  scrollDelayMs: 600,
  networkIdleTimeoutMs: 60_000,
}
