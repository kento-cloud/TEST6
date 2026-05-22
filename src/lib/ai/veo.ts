/**
 * Google Veo API (Vertex AI) — AI動画生成
 * テキストプロンプトから5-8秒のMP4動画を生成
 *
 * 必要な環境変数:
 * - GOOGLE_CLOUD_PROJECT_ID: GCPプロジェクトID
 * - GOOGLE_CLOUD_ACCESS_TOKEN: アクセストークン（gcloud auth print-access-token）
 *   or GOOGLE_APPLICATION_CREDENTIALS: サービスアカウントJSONのパス
 * - GOOGLE_CLOUD_STORAGE_BUCKET: 出力用GCSバケット名
 */
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const VEO_MODEL = "veo-3.1-generate-001"
const VEO_REGION = "us-central1"
const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 120 // 10分

interface VeoConfig {
  readonly projectId: string
  readonly accessToken: string
  readonly storageBucket: string
}

interface VeoGenerateResult {
  readonly videoPath: string
  readonly gcsUri: string
}

/**
 * Veo設定を環境変数から取得
 * Gemini API経由: GOOGLE_API_KEY のみで動作
 * Vertex AI経由: PROJECT_ID + ACCESS_TOKEN + BUCKET が必要
 */
export function getVeoConfig(): VeoConfig | null {
  // Gemini API経由（シンプル）
  const googleApiKey = process.env.GOOGLE_API_KEY
  if (googleApiKey) {
    return {
      projectId: "gemini-api",
      accessToken: googleApiKey,
      storageBucket: "",
    }
  }

  // Vertex AI経由（フル機能）
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  const accessToken = process.env.GOOGLE_CLOUD_ACCESS_TOKEN
  const storageBucket = process.env.GOOGLE_CLOUD_STORAGE_BUCKET

  if (!projectId || !accessToken || !storageBucket) {
    return null
  }

  return { projectId, accessToken, storageBucket }
}

/**
 * Veo APIが利用可能かチェック
 */
export function isVeoAvailable(): boolean {
  return getVeoConfig() !== null
}

/**
 * Veo APIでテキストから動画を生成（8秒、縦型9:16）
 */
export async function generateVideoFromText(
  prompt: string,
  outputDir: string,
  fileName: string,
  config: VeoConfig,
  options?: {
    aspectRatio?: "16:9" | "9:16"
    duration?: 4 | 6 | 8
    resolution?: "720p" | "1080p"
  }
): Promise<VeoGenerateResult> {
  const aspectRatio = options?.aspectRatio ?? "9:16"
  const resolution = options?.resolution ?? "720p"

  const endpoint = `https://${VEO_REGION}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${VEO_REGION}/publishers/google/models/${VEO_MODEL}:predictLongRunning`

  // Step 1: リクエスト送信
  const requestBody = {
    instances: [{ prompt }],
    parameters: {
      storageUri: `gs://${config.storageBucket}/paddock-shorts/`,
      sampleCount: 1,
      aspectRatio,
      resolution,
      personGeneration: "disallow",
    },
  }

  const startResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(requestBody),
  })

  if (!startResponse.ok) {
    const errorText = await startResponse.text()
    throw new Error(`Veo API request failed (${startResponse.status}): ${errorText}`)
  }

  const startResult = await startResponse.json() as { name: string }
  const operationName = startResult.name
  console.log(`[veo] Operation started: ${operationName}`)

  // Step 2: ポーリングで完了待ち
  const pollEndpoint = `https://${VEO_REGION}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${VEO_REGION}/publishers/google/models/${VEO_MODEL}:fetchPredictOperation`

  let gcsUri = ""
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

    const pollResponse = await fetch(pollEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.accessToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ operationName }),
    })

    if (!pollResponse.ok) continue

    const pollResult = await pollResponse.json() as {
      done?: boolean
      response?: { videos?: { gcsUri: string }[] }
      error?: { message: string }
    }

    if (pollResult.error) {
      throw new Error(`Veo generation failed: ${pollResult.error.message}`)
    }

    if (pollResult.done && pollResult.response?.videos?.[0]) {
      gcsUri = pollResult.response.videos[0].gcsUri
      console.log(`[veo] Video generated: ${gcsUri}`)
      break
    }
  }

  if (!gcsUri) {
    throw new Error("Veo generation timed out")
  }

  // Step 3: GCSから動画をダウンロード
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, fileName)
  const downloadUrl = `https://storage.googleapis.com/${gcsUri.replace("gs://", "")}`

  const downloadResponse = await fetch(downloadUrl, {
    headers: { "Authorization": `Bearer ${config.accessToken}` },
  })

  if (!downloadResponse.ok) {
    throw new Error(`Failed to download video from GCS: ${downloadResponse.status}`)
  }

  const videoBuffer = Buffer.from(await downloadResponse.arrayBuffer())
  await writeFile(outputPath, videoBuffer)
  console.log(`[veo] Downloaded to: ${outputPath} (${videoBuffer.length} bytes)`)

  return { videoPath: outputPath, gcsUri }
}

/**
 * 複数カットの動画を一括生成
 */
export async function generateMultipleClips(
  prompts: string[],
  outputDir: string,
  config: VeoConfig,
  options?: { aspectRatio?: "16:9" | "9:16"; resolution?: "720p" | "1080p" }
): Promise<string[]> {
  const paths: string[] = []

  for (let i = 0; i < prompts.length; i++) {
    console.log(`[veo] Generating clip ${i + 1}/${prompts.length}`)
    try {
      const result = await generateVideoFromText(
        prompts[i],
        outputDir,
        `clip_${i}.mp4`,
        config,
        { aspectRatio: options?.aspectRatio ?? "9:16", resolution: options?.resolution ?? "720p" }
      )
      paths.push(result.videoPath)
    } catch (error) {
      console.error(`[veo] Clip ${i} failed:`, error)
      // 失敗したクリップはスキップ
    }
  }

  return paths
}
