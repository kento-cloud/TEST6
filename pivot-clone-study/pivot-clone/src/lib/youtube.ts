import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"

const execFileAsync = promisify(execFile)

function getYtDlpPath(): string {
  const homeBin = path.join(process.env.HOME ?? "", ".local", "bin", "yt-dlp")
  if (existsSync(homeBin)) return homeBin
  return "yt-dlp" // PATH上のものを使う
}

interface YouTubeMetadata {
  readonly videoId: string
  readonly title: string
  readonly authorName: string
  readonly thumbnailUrl: string
}

/**
 * YouTube URLからvideoIdを抽出
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * YouTube oEmbed APIでメタデータ取得（API Key不要）
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeMetadata> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  const res = await fetch(oembedUrl)
  if (!res.ok) {
    throw new Error(`YouTube metadata取得失敗: ${res.status}`)
  }
  const data = await res.json() as { title: string; author_name: string; thumbnail_url: string }
  return {
    videoId,
    title: data.title,
    authorName: data.author_name,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  }
}

/**
 * YouTubeサムネイルをダウンロードして保存
 */
export async function downloadYouTubeThumbnail(videoId: string, savePath: string): Promise<string> {
  const dir = path.dirname(savePath)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  // Try maxresdefault first, fallback to hqdefault
  const urls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const buffer = await res.arrayBuffer()
        await writeFile(savePath, Buffer.from(buffer))
        return savePath
      }
    } catch {
      continue
    }
  }
  throw new Error("サムネイルのダウンロードに失敗しました")
}

/**
 * YouTube動画の音声をダウンロード（yt-dlp使用）
 * Whisperに渡すためのMP3ファイルを生成
 */
export async function downloadYouTubeAudio(videoId: string, savePath: string): Promise<string> {
  const dir = path.dirname(savePath)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`

  await execFileAsync(getYtDlpPath(), [
    "-x",
    "--audio-format", "mp3",
    "--audio-quality", "5",
    "--postprocessor-args", "-ar 16000 -ac 1",
    "-o", savePath.replace(/\.mp3$/, ".%(ext)s"),
    "--no-playlist",
    url,
  ], { timeout: 300000 }) // 5分タイムアウト

  // yt-dlpは拡張子を自動付与するので確認
  if (!existsSync(savePath)) {
    // webm→mp3変換後のファイルを探す
    const possiblePath = savePath.replace(/\.mp3$/, ".mp3")
    if (existsSync(possiblePath)) {
      return possiblePath
    }
    throw new Error("YouTube音声のダウンロードに失敗しました")
  }

  return savePath
}
