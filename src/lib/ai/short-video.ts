/**
 * ショート動画自動生成
 * 記事 → キーポイント抽出 → AI画像生成 → TTS音声 → FFmpeg合成 → MP4
 */
import OpenAI from "openai"
import { existsSync } from "fs"
import { mkdir, writeFile, readdir, unlink } from "fs/promises"
import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"

const execFileAsync = promisify(execFile)

// macOS: ヒラギノ角ゴシック W7（太字でテロップ向き）
const FONT_PATH = "/System/Library/Fonts/ヒラギノ角ゴシック W7.ttc"
const FALLBACK_FONT = "/System/Library/Fonts/Hiragino Sans W7.ttc"

function getFontPath(): string {
  if (existsSync(FONT_PATH)) return FONT_PATH
  if (existsSync(FALLBACK_FONT)) return FALLBACK_FONT
  return "Hiragino Sans"
}

interface Slide {
  readonly keypoint: string
  readonly imagePrompt: string
  readonly narration: string
}

interface ShortVideoResult {
  readonly videoPath: string
  readonly slides: readonly Slide[]
  readonly durationSeconds: number
}

/**
 * Phase 1: 記事からスライド構成を生成
 */
async function extractSlides(article: string, title: string, apiKey: string): Promise<Slide[]> {
  const openai = new OpenAI({ apiKey })

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `あなたは競馬メディアのショート動画クリエイターです。記事から60秒のショート動画（縦型スライド形式）を作るための構成を生成してください。

出力はJSON形式で:
{
  "slides": [
    {
      "keypoint": "テロップに表示する短いフレーズ（15-25文字）",
      "imagePrompt": "English prompt for vertical image generation (1080x1920). Cinematic horse racing related imagery, no text, no faces.",
      "narration": "このスライドのナレーション（2-3文、自然な話し言葉）"
    }
  ]
}

ルール:
- スライドは6枚ちょうど（各10秒 = 合計60秒）
- keypointは視聴者の目を引くパンチのあるフレーズ
- imagePromptは競馬に関連する映像的なシーン（馬、ターフ、パドック、レース等）
- narrationは語りかけるトーン。「〜なんですよ」「〜してみてください」等
- 馬名はカタカナで正確に
- 1枚目は引きの強い導入、最後はまとめ or 次回予告`
      },
      {
        role: "user",
        content: `タイトル: ${title}\n\n記事:\n${article.slice(0, 8000)}`
      }
    ],
  })

  const content = response.choices[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(content) as { slides?: Slide[] }
  return parsed.slides ?? []
}

/**
 * Phase 2: AI画像生成（各スライド）
 */
async function generateSlideImages(
  slides: Slide[],
  outputDir: string,
  apiKey: string
): Promise<string[]> {
  const openai = new OpenAI({ apiKey })
  const paths: string[] = []

  for (let i = 0; i < slides.length; i++) {
    const filePath = path.join(outputDir, `slide_${i}.png`)

    try {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: slides[i].imagePrompt,
        n: 1,
        size: "1024x1792", // 縦型（9:16に近い）
        quality: "medium",
      } as Parameters<typeof openai.images.generate>[0])

      const imageData = (response as unknown as { data: { b64_json?: string; url?: string }[] }).data[0]

      if (imageData.b64_json) {
        await writeFile(filePath, Buffer.from(imageData.b64_json, "base64"))
      } else if (imageData.url) {
        const res = await fetch(imageData.url)
        const buffer = await res.arrayBuffer()
        await writeFile(filePath, Buffer.from(buffer))
      }

      paths.push(filePath)
      console.log(`[short-video] Slide ${i + 1}/${slides.length} image generated`)
    } catch (error) {
      console.error(`[short-video] Slide ${i} image generation failed:`, error)
      // フォールバック: 黒背景画像を生成
      await execFileAsync("ffmpeg", [
        "-y", "-f", "lavfi", "-i", `color=c=black:s=1080x1920:d=1`,
        "-frames:v", "1", filePath,
      ])
      paths.push(filePath)
    }
  }

  return paths
}

/**
 * Phase 2b: TTS音声生成
 */
async function generateNarration(
  slides: Slide[],
  outputPath: string,
  apiKey: string
): Promise<string> {
  const openai = new OpenAI({ apiKey })
  const fullScript = slides.map(s => s.narration).join("。\n\n")

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: fullScript,
    speed: 0.95,
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(outputPath, buffer)
  console.log(`[short-video] Narration generated: ${buffer.length} bytes`)
  return outputPath
}

/**
 * Phase 3: FFmpeg合成（画像 + テロップ + 音声 → MP4）
 */
async function compositeVideo(
  imagePaths: string[],
  narrationPath: string,
  slides: Slide[],
  outputPath: string
): Promise<number> {
  // 音声の長さを取得
  const { stdout: durationStr } = await execFileAsync("ffprobe", [
    "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0",
    narrationPath,
  ])
  const totalDuration = parseFloat(durationStr.trim()) || 60
  const slideDuration = totalDuration / imagePaths.length

  const fontPath = getFontPath()

  // 各スライドを個別に動画化（テロップ+ズームアニメ付き）
  const slideVideoPaths: string[] = []
  const tempDir = path.dirname(outputPath)

  for (let i = 0; i < imagePaths.length; i++) {
    const slideVideoPath = path.join(tempDir, `slide_video_${i}.mp4`)
    const keypoint = slides[i].keypoint.replace(/'/g, "'\\''").replace(/:/g, "\\:")

    // Ken Burnsエフェクト（ゆっくりズームイン）+ テロップ
    await execFileAsync("ffmpeg", [
      "-y",
      "-loop", "1",
      "-i", imagePaths[i],
      "-t", String(slideDuration),
      "-vf", [
        // ズームアニメーション（1.0→1.1）
        `scale=1188:2112,zoompan=z='min(zoom+0.0005,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(slideDuration * 25)}:s=1080x1920:fps=25`,
        // テロップ（下部中央、白文字+黒背景帯）
        `drawbox=y=ih-300:w=iw:h=200:color=black@0.6:t=fill`,
        `drawtext=fontfile='${fontPath}':text='${keypoint}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-240:borderw=2:bordercolor=black`,
      ].join(","),
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-r", "25",
      slideVideoPath,
    ], { timeout: 60000 })

    slideVideoPaths.push(slideVideoPath)
  }

  // concat用のリストファイル作成
  const concatListPath = path.join(tempDir, "concat_list.txt")
  const concatContent = slideVideoPaths.map(p => `file '${p}'`).join("\n")
  await writeFile(concatListPath, concatContent)

  // スライド動画を結合
  const silentVideoPath = path.join(tempDir, "silent_video.mp4")
  await execFileAsync("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0",
    "-i", concatListPath,
    "-c", "copy",
    silentVideoPath,
  ], { timeout: 60000 })

  // 音声を合成
  await execFileAsync("ffmpeg", [
    "-y",
    "-i", silentVideoPath,
    "-i", narrationPath,
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "128k",
    "-shortest",
    outputPath,
  ], { timeout: 60000 })

  // 一時ファイル削除
  for (const p of slideVideoPaths) {
    await unlink(p).catch(() => {})
  }
  await unlink(concatListPath).catch(() => {})
  await unlink(silentVideoPath).catch(() => {})

  console.log(`[short-video] Final video composed: ${outputPath}`)
  return totalDuration
}

/**
 * メイン: 記事からショート動画を生成
 */
export async function generateShortVideo(
  videoId: string,
  article: string,
  title: string,
  apiKey: string
): Promise<ShortVideoResult> {
  const outputDir = path.join(process.cwd(), "uploads", "shorts", videoId)
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  console.log(`[short-video] Starting for: ${title.slice(0, 40)}`)

  // Phase 1: キーポイント抽出
  console.log("[short-video] Phase 1: Extracting slides...")
  const slides = await extractSlides(article, title, apiKey)
  if (slides.length === 0) {
    throw new Error("スライド構成の生成に失敗しました")
  }
  console.log(`[short-video] ${slides.length} slides extracted`)

  // Phase 2a: 画像生成
  console.log("[short-video] Phase 2a: Generating images...")
  const imagePaths = await generateSlideImages(slides, outputDir, apiKey)

  // Phase 2b: TTS音声生成
  console.log("[short-video] Phase 2b: Generating narration...")
  const narrationPath = path.join(outputDir, "narration.mp3")
  await generateNarration(slides, narrationPath, apiKey)

  // Phase 3: FFmpeg合成
  console.log("[short-video] Phase 3: Compositing video...")
  const outputPath = path.join(outputDir, "short.mp4")
  const durationSeconds = await compositeVideo(imagePaths, narrationPath, slides, outputPath)

  return {
    videoPath: `/uploads/shorts/${videoId}/short.mp4`,
    slides,
    durationSeconds,
  }
}
