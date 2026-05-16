import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"

export interface MockAIContents {
  readonly summary: string
  readonly chapters: string
  readonly article: string
  readonly tags: string
}

const MOCK_SUMMARY = "[モック] AI APIが未接続のため、モックデータです。接続後に再生成してください。"
const MOCK_CHAPTERS = JSON.stringify([
  { title: "イントロダクション", startTime: 0, endTime: 120, summary: "動画の導入部分です。" },
  { title: "メインコンテンツ", startTime: 120, endTime: 360, summary: "主要なトピックについて解説します。" },
  { title: "まとめ", startTime: 360, endTime: 480, summary: "内容の振り返りと結論です。" },
])
const MOCK_ARTICLE = "## モック記事\n\nAI API接続後に本番の記事が生成されます。\n\n### 概要\n\nこの記事はモックデータです。"
const MOCK_TAGS = JSON.stringify(["モック", "テスト", "AI未接続"])

/**
 * API未設定時にモックAIコンテンツを挿入し、動画ステータスをreviewに更新する
 */
export async function insertMockAIContents(videoId: string): Promise<MockAIContents> {
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from("ai_contents")
    .select("id")
    .eq("video_id", videoId)
    .single()

  if (existing) {
    await supabase.from("ai_contents").update({
      summary: MOCK_SUMMARY,
      chapters: MOCK_CHAPTERS,
      article: MOCK_ARTICLE,
      tags: MOCK_TAGS,
      status: "done",
      updated_at: now,
    }).eq("video_id", videoId)
  } else {
    await supabase.from("ai_contents").insert({
      id: ulid(),
      video_id: videoId,
      summary: MOCK_SUMMARY,
      chapters: MOCK_CHAPTERS,
      article: MOCK_ARTICLE,
      tags: MOCK_TAGS,
      status: "done",
      created_at: now,
      updated_at: now,
    })
  }

  await supabase.from("videos").update({
    publish_status: "review",
    processing_step: "none",
    updated_at: now,
  }).eq("id", videoId)

  return {
    summary: MOCK_SUMMARY,
    chapters: MOCK_CHAPTERS,
    article: MOCK_ARTICLE,
    tags: MOCK_TAGS,
  }
}

/**
 * 個別ステップのモックフォールバック
 */
export async function insertMockStepContent(videoId: string, step: "summary" | "chapters" | "article" | "tags"): Promise<string> {
  const now = new Date().toISOString()
  const mockData: Record<"summary" | "chapters" | "article" | "tags", { field: string; value: string }> = {
    summary: { field: "summary", value: MOCK_SUMMARY },
    chapters: { field: "chapters", value: MOCK_CHAPTERS },
    article: { field: "article", value: MOCK_ARTICLE },
    tags: { field: "tags", value: MOCK_TAGS },
  }

  const mock = mockData[step]
  const { data: existing } = await supabase
    .from("ai_contents")
    .select("id")
    .eq("video_id", videoId)
    .single()

  if (existing) {
    await supabase.from("ai_contents").update({
      [mock.field]: mock.value,
      updated_at: now,
    }).eq("video_id", videoId)
  } else {
    await supabase.from("ai_contents").insert({
      id: ulid(),
      video_id: videoId,
      [mock.field]: mock.value,
      status: "done",
      created_at: now,
      updated_at: now,
    })
  }

  await supabase.from("videos").update({
    processing_step: "none",
    updated_at: now,
  }).eq("id", videoId)

  return mock.value
}
