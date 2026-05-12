import { readFileSync } from "fs"
import type { ScreenshotPair } from "./types.js"

export interface DiffResult {
  readonly name: string
  readonly liveSizeBytes: number
  readonly localSizeBytes: number
  readonly sizeDiffPercent: number
}

/**
 * live と local のスクリーンショットをファイルサイズで比較する。
 * ピクセル単位の差分比較は外部ツール（pixelmatch等）に委ねる。
 */
export function compareScreenshots(
  screenshots: readonly ScreenshotPair[]
): DiffResult[] {
  const results: DiffResult[] = []

  for (const ss of screenshots) {
    try {
      const liveBuf = readFileSync(ss.livePath)
      const localBuf = readFileSync(ss.localPath)

      const sizeDiff = Math.abs(liveBuf.length - localBuf.length)
      const avgSize = (liveBuf.length + localBuf.length) / 2
      const diffPercent = avgSize > 0 ? (sizeDiff / avgSize) * 100 : 0

      results.push({
        name: ss.name,
        liveSizeBytes: liveBuf.length,
        localSizeBytes: localBuf.length,
        sizeDiffPercent: Math.round(diffPercent * 100) / 100,
      })
    } catch (error) {
      console.warn(`[diff] Could not compare ${ss.name}:`, error)
    }
  }

  return results
}
