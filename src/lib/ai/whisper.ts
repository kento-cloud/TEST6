import OpenAI from "openai"
import fs from "fs"
import path from "path"
import { execFile } from "child_process"
import { promisify } from "util"
import { getAIModels } from "@/lib/ai/models"

const execFileAsync = promisify(execFile)

const MAX_DURATION_SECONDS = 1200 // 20分チャンク（Whisper上限は約23分だが余裕を持たせる）

interface WhisperResult {
  readonly text: string
  readonly segments: readonly {
    readonly start: number
    readonly end: number
    readonly text: string
  }[]
  readonly language: string
  readonly duration?: number
}

/** ffprobeで音声ファイルの長さを取得 */
async function getAudioDuration(audioPath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      audioPath,
    ])
    return parseFloat(stdout.trim()) || 0
  } catch {
    return 0
  }
}

/** ffmpegで音声を分割（再エンコードで正確な分割を保証） */
async function splitAudio(audioPath: string, chunkDir: string, chunkDuration: number): Promise<string[]> {
  const duration = await getAudioDuration(audioPath)
  if (duration <= 0) return [audioPath]

  const chunks: string[] = []

  for (let start = 0; start < duration; start += chunkDuration) {
    const chunkPath = path.join(chunkDir, `chunk_${chunks.length}.mp3`)
    await execFileAsync("ffmpeg", [
      "-y", "-i", audioPath,
      "-ss", String(start),
      "-t", String(chunkDuration),
      "-ar", "16000",
      "-ac", "1",
      "-ab", "64k",
      chunkPath,
    ], { timeout: 120000 })

    // チャンクが正常に作成されたか確認
    const chunkDur = await getAudioDuration(chunkPath)
    if (chunkDur > 0) {
      console.log(`[whisper] Chunk ${chunks.length}: ${Math.round(chunkDur)}s`)
      chunks.push(chunkPath)
    }
  }

  return chunks
}

/** 単一ファイルをWhisperで文字起こし */
async function transcribeChunk(
  openai: OpenAI,
  chunkPath: string,
  model: string,
  isWhisper1: boolean,
): Promise<WhisperResult> {
  if (isWhisper1) {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(chunkPath),
      model: "whisper-1",
      language: "ja",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })

    const segments = (response as unknown as { segments?: Array<{ start: number; end: number; text: string }> }).segments ?? []

    return {
      text: response.text,
      segments: segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text.trim(),
      })),
      language: "ja",
    }
  }

  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(chunkPath),
    model,
    language: "ja",
    response_format: "json",
  })

  return {
    text: response.text,
    segments: [],
    language: "ja",
  }
}

export async function transcribeAudio(audioPath: string): Promise<WhisperResult> {
  const { getConfigValue } = await import("@/lib/config")
  const apiKey = await getConfigValue("OPENAI_API_KEY")
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません。管理画面の設定ページから登録してください。")
  }

  const models = await getAIModels()
  const openai = new OpenAI({ apiKey })
  const isWhisper1 = models.transcribe === "whisper-1"

  // 音声の長さを確認
  const totalDuration = await getAudioDuration(audioPath)

  // 短い音声はそのまま処理
  if (totalDuration <= MAX_DURATION_SECONDS || totalDuration <= 0) {
    const result = await transcribeChunk(openai, audioPath, models.transcribe, isWhisper1)
    return { ...result, duration: totalDuration > 0 ? totalDuration : undefined }
  }

  // 長い音声は分割して処理
  const chunkCount = Math.ceil(totalDuration / MAX_DURATION_SECONDS)
  console.log(`[whisper] Audio ${Math.round(totalDuration)}s exceeds limit, splitting into ${chunkCount} chunks`)

  const chunkDir = path.join(path.dirname(audioPath), "chunks")
  const { mkdir, unlink, readdir } = await import("fs/promises")
  await mkdir(chunkDir, { recursive: true })

  try {
    const chunks = await splitAudio(audioPath, chunkDir, MAX_DURATION_SECONDS)
    const results: WhisperResult[] = []

    for (let i = 0; i < chunks.length; i++) {
      console.log(`[whisper] Processing chunk ${i + 1}/${chunks.length}`)
      const result = await transcribeChunk(openai, chunks[i], models.transcribe, isWhisper1)
      console.log(`[whisper] Chunk ${i + 1} done: ${result.text.length} chars`)
      results.push(result)
    }

    // 結果を結合（タイムスタンプをオフセット）
    const allSegments: { start: number; end: number; text: string }[] = []
    const allTexts: string[] = []

    for (let i = 0; i < results.length; i++) {
      const offset = i * MAX_DURATION_SECONDS
      allTexts.push(results[i].text)
      for (const seg of results[i].segments) {
        allSegments.push({
          start: seg.start + offset,
          end: seg.end + offset,
          text: seg.text,
        })
      }
    }

    const combinedText = allTexts.join("\n\n")
    console.log(`[whisper] Combined: ${combinedText.length} chars from ${results.length} chunks`)

    return {
      text: combinedText,
      segments: allSegments,
      language: "ja",
      duration: totalDuration,
    }
  } finally {
    // チャンクファイルを削除
    try {
      const files = await readdir(chunkDir)
      for (const f of files) {
        await unlink(path.join(chunkDir, f)).catch(() => {})
      }
      const { rmdir } = await import("fs/promises")
      await rmdir(chunkDir).catch(() => {})
    } catch { /* ignore cleanup errors */ }
  }
}
