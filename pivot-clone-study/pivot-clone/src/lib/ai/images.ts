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

/**
 * OpenAI Images API でサムネイル画像を生成
 * モデルは管理画面設定で切り替え可能（gpt-image-1 / gpt-image-2）
 */
export async function generateThumbnailImage(
  prompt: string,
  outputDir: string,
  fileName: string,
): Promise<GenerateImageResult> {
  const { getConfigValue } = await import("@/lib/config")
  const apiKey = await getConfigValue("OPENAI_API_KEY")
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません。管理画面の設定ページから登録してください。")
  }

  const models = await getAIModels()
  const openai = new OpenAI({ apiKey })

  const response = await openai.images.generate({
    model: models.image,
    prompt,
    n: 1,
    size: "1536x1024",
    quality: "medium",
  })

  const imageData = response.data?.[0]
  if (!imageData?.b64_json) {
    throw new Error("画像生成レスポンスが空です")
  }

  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  const buffer = Buffer.from(imageData.b64_json, "base64")
  const filePath = path.join(outputDir, fileName)
  await writeFile(filePath, buffer)

  return {
    filePath: `/uploads/thumbnails/${fileName}`,
    width: 1536,
    height: 1024,
    fileSize: buffer.length,
  }
}
