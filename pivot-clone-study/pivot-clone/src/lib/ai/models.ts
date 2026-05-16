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

export const TEXT_MODEL_OPTIONS = [
  // フロンティア（最先端）
  { id: "gpt-5.5", label: "GPT-5.5（最新・最強）", group: "フロンティア" },
  { id: "gpt-5.5-pro", label: "GPT-5.5 Pro（精度重視）", group: "フロンティア" },
  { id: "gpt-5.4", label: "GPT-5.4（バランス）", group: "フロンティア" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini（軽量）", group: "フロンティア" },
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano（最安）", group: "フロンティア" },
  // 旧世代（堅牢）
  { id: "gpt-4.1", label: "GPT-4.1（コスパ推奨）", group: "旧世代" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini（高速）", group: "旧世代" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano（最速）", group: "旧世代" },
] as const

export const IMAGE_MODEL_OPTIONS = [
  { id: "gpt-image-2", label: "GPT Image 2（最新・高品質）" },
  { id: "gpt-image-1-mini", label: "GPT Image 1 Mini（軽量）" },
] as const

export const TRANSCRIBE_MODEL_OPTIONS = [
  { id: "gpt-4o-transcribe", label: "GPT-4o Transcribe（高品質）" },
  { id: "gpt-4o-mini-transcribe", label: "GPT-4o Mini Transcribe（軽量）" },
  { id: "whisper-1", label: "Whisper-1（従来版）" },
] as const

export async function getAIModels(): Promise<AIModels> {
  return {
    text: (await getConfigValue("AI_TEXT_MODEL")) || "gpt-4.1",
    image: (await getConfigValue("AI_IMAGE_MODEL")) || "gpt-image-2",
    transcribe: (await getConfigValue("AI_TRANSCRIBE_MODEL")) || "gpt-4o-transcribe",
  }
}
