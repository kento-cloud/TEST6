/**
 * AIモデル設定
 *
 * system_configテーブル優先、環境変数フォールバック。
 * 全てOpenAI APIキー1つで動作。
 */

import { getConfigValue } from "@/lib/config"

export interface AIModels {
  readonly text: string
  readonly image: string
  readonly transcribe: string
}

export async function getAIModels(): Promise<AIModels> {
  return {
    text: (await getConfigValue("AI_TEXT_MODEL")) || "gpt-4.1",
    image: (await getConfigValue("AI_IMAGE_MODEL")) || "gpt-image-2",
    transcribe: (await getConfigValue("AI_TRANSCRIBE_MODEL")) || "gpt-4o-transcribe",
  }
}
