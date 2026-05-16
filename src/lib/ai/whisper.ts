import OpenAI from "openai"
import fs from "fs"
import { getAIModels } from "@/lib/ai/models"

interface WhisperResult {
  readonly text: string
  readonly segments: readonly {
    readonly start: number
    readonly end: number
    readonly text: string
  }[]
  readonly language: string
}

export async function transcribeAudio(audioPath: string): Promise<WhisperResult> {
  const { getConfigValue } = await import("@/lib/config")
  const apiKey = await getConfigValue("OPENAI_API_KEY")
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません。管理画面の設定ページから登録してください。")
  }

  const models = await getAIModels()
  const openai = new OpenAI({ apiKey })

  // gpt-4o-transcribe系は verbose_json 非対応、whisper-1 は対応
  const isWhisper1 = models.transcribe === "whisper-1"

  if (isWhisper1) {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
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

  // gpt-4o-transcribe / gpt-4o-mini-transcribe
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: models.transcribe,
    language: "ja",
    response_format: "json",
  })

  return {
    text: response.text,
    segments: [],
    language: "ja",
  }
}
