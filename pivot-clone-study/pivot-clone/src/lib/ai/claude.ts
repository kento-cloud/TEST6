import Anthropic from "@anthropic-ai/sdk"
import type { AIGeneratedContent } from "@/types/ai"
import { SYSTEM_PROMPT, buildGeneratePrompt } from "./prompts"

export async function generateAIContent(
  title: string,
  category: string,
  transcription: string
): Promise<AIGeneratedContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません")
  }

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildGeneratePrompt(title, category, transcription),
      },
    ],
  })

  const textBlock = message.content.find((b) => b.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude APIからテキスト応答がありません")
  }

  const jsonText = textBlock.text.trim()

  // Extract JSON from response (handle potential markdown code blocks)
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("JSONの解析に失敗しました: " + jsonText.slice(0, 200))
  }

  const parsed = JSON.parse(jsonMatch[0]) as AIGeneratedContent
  return {
    summary: parsed.summary ?? "",
    chapters: parsed.chapters ?? [],
    article: parsed.article ?? "",
    tags: parsed.tags ?? [],
    relatedCategories: parsed.relatedCategories ?? [],
  }
}
