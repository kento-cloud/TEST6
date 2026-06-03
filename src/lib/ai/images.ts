import OpenAI from "openai"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { getAIModels } from "@/lib/ai/models"

interface GenerateImageResult {
  readonly filePath: string
  readonly width: number
  readonly height: number
  readonly fileSize: number
}

interface ImageModelParams {
  readonly size: string
  readonly width: number
  readonly height: number
  readonly quality: string | null
  readonly responseFormat: boolean
}

/**
 * モデル別の有効な画像生成パラメータ（16:9寄りの横長を選択）。
 * - gpt-image-1 / gpt-image-2: size=1536x1024、quality=low|medium|high、response_format非対応
 * - dall-e-3: size=1792x1024、quality=standard|hd、response_format対応
 * - dall-e-2: size=1024x1024、quality指定不可、response_format対応
 */
function imageParamsFor(model: string): ImageModelParams {
  if (model.startsWith("dall-e-3")) {
    return { size: "1792x1024", width: 1792, height: 1024, quality: "hd", responseFormat: true }
  }
  if (model.startsWith("dall-e-2")) {
    return { size: "1024x1024", width: 1024, height: 1024, quality: null, responseFormat: true }
  }
  // gpt-image-1 / gpt-image-2（既定）
  return { size: "1536x1024", width: 1536, height: 1024, quality: "medium", responseFormat: false }
}

/**
 * OpenAI Images API でサムネイル画像を生成（複数枚対応）
 * モデルは管理画面設定で切り替え可能（gpt-image-1 / gpt-image-2）
 */
export async function generateThumbnailImage(
  prompt: string,
  outputDir: string,
  fileName: string,
): Promise<GenerateImageResult> {
  const results = await generateThumbnailImages(prompt, outputDir, [fileName])
  return results[0]
}

/**
 * 複数枚のサムネイルを一括生成
 */
export async function generateThumbnailImages(
  prompt: string,
  outputDir: string,
  fileNames: string[],
): Promise<GenerateImageResult[]> {
  const { getConfigValue } = await import("@/lib/config")
  const apiKey = await getConfigValue("OPENAI_API_KEY")
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません。管理画面の設定ページから登録してください。")
  }

  const models = await getAIModels()
  const openai = new OpenAI({ apiKey })

  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  const cfg = imageParamsFor(models.image)

  const generateOne = async (fileName: string): Promise<GenerateImageResult> => {
    const params: Record<string, unknown> = {
      model: models.image,
      prompt,
      n: 1,
      size: cfg.size,
    }
    // gpt-image系: quality=low/medium/high、response_format非対応（既定でb64_json返却）
    // dall-e系: quality=standard/hd（dall-e-2は指定不可）、response_formatでb64_json取得
    if (cfg.quality) params.quality = cfg.quality
    if (cfg.responseFormat) params.response_format = "b64_json"

    const response = await openai.images.generate(params as unknown as Parameters<typeof openai.images.generate>[0]) as unknown as { data: Array<{ b64_json?: string; url?: string }> }

    const imageData = response.data?.[0]
    if (!imageData) {
      throw new Error("画像生成レスポンスが空です")
    }

    // b64_json or URL からバッファを取得
    let buffer: Buffer
    if (imageData.b64_json) {
      buffer = Buffer.from(imageData.b64_json, "base64")
    } else if (imageData.url) {
      const res = await fetch(imageData.url)
      if (!res.ok) throw new Error("画像URLからのダウンロードに失敗しました")
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      throw new Error("画像生成レスポンスにデータがありません")
    }
    const filePath = path.join(outputDir, fileName)
    await writeFile(filePath, buffer)

    return {
      filePath: `/api/uploads/thumbnails/${fileName}`,
      width: cfg.width,
      height: cfg.height,
      fileSize: buffer.length,
    }
  }

  // Promise.allSettledで部分的失敗を許容
  const settled = await Promise.allSettled(fileNames.map(generateOne))
  const results: GenerateImageResult[] = []
  for (const s of settled) {
    if (s.status === "fulfilled") {
      results.push(s.value)
    }
  }
  if (results.length === 0) {
    throw new Error("全ての画像生成に失敗しました")
  }
  return results
}
