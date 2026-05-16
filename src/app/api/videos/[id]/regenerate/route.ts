import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { requireAdmin } from "@/lib/auth"
import { generateSummary, generateChapters, generateArticle, generateTags } from "@/lib/ai/pipeline"
import type { GenerationStep } from "@/types/ai"

const VALID_STEPS: readonly GenerationStep[] = ["summary", "chapters", "article", "tags"]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const body = await req.json().catch(() => ({})) as { step?: string; customInstruction?: string; promptMode?: "append" | "override" }
  const step = body.step as GenerationStep

  if (!step || !VALID_STEPS.includes(step)) {
    return NextResponse.json({
      error: `stepは ${VALID_STEPS.join(", ")} のいずれかを指定してください`,
    }, { status: 400 })
  }

  const { data: video, error: videoErr } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single()

  if (videoErr || !video) {
    return NextResponse.json({ error: "動画が見つかりません" }, { status: 404 })
  }

  const { data: transcript } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("video_id", id)
    .single()

  if (!transcript || transcript.status !== "done") {
    return NextResponse.json({ error: "文字起こしが完了していません" }, { status: 400 })
  }

  try {
    let result: unknown
    const ci = body.customInstruction
    const pm = body.promptMode
    switch (step) {
      case "summary":
        result = await generateSummary(id, transcript.full_text, video.title, ci, pm)
        break
      case "chapters":
        result = await generateChapters(id, transcript.full_text, video.title, ci, pm)
        break
      case "article":
        result = await generateArticle(id, transcript.full_text, video.title, ci, pm)
        break
      case "tags":
        result = await generateTags(id, transcript.full_text, video.title, ci, pm)
        break
    }

    return NextResponse.json({ status: "done", step, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`[regenerate:${step}] Error for video ${id}:`, message)
    const isConfigError = message.includes("設定されていません")

    if (isConfigError) {
      // モックフォールバック: API未設定時にモックデータを挿入
      const now = new Date().toISOString()
      const mockData: Record<"summary" | "chapters" | "article" | "tags", { field: string; value: string }> = {
        summary: { field: "summary", value: "[モック] AI APIが未接続のため、モックデータです。接続後に再生成してください。" },
        chapters: { field: "chapters", value: JSON.stringify([
          { title: "イントロダクション", startTime: 0, endTime: 120, summary: "動画の導入部分です。" },
          { title: "メインコンテンツ", startTime: 120, endTime: 360, summary: "主要なトピックについて解説します。" },
          { title: "まとめ", startTime: 360, endTime: 480, summary: "内容の振り返りと結論です。" },
        ]) },
        article: { field: "article", value: "## モック記事\n\nAI API接続後に本番の記事が生成されます。\n\n### 概要\n\nこの記事はモックデータです。" },
        tags: { field: "tags", value: JSON.stringify(["モック", "テスト", "AI未接続"]) },
      }

      const stepKey = step as "summary" | "chapters" | "article" | "tags"
      const mock = mockData[stepKey]
      const { data: existing } = await supabase
        .from("ai_contents")
        .select("id")
        .eq("video_id", id)
        .single()

      if (existing) {
        await supabase.from("ai_contents").update({
          [mock.field]: mock.value,
          updated_at: now,
        }).eq("video_id", id)
      } else {
        await supabase.from("ai_contents").insert({
          id: ulid(),
          video_id: id,
          [mock.field]: mock.value,
          status: "done",
          created_at: now,
          updated_at: now,
        })
      }

      await supabase.from("videos").update({
        processing_step: "none",
        updated_at: now,
      }).eq("id", id)

      return NextResponse.json({ status: "done", step, mock: true, result: mock.value })
    }

    return NextResponse.json({
      status: "error",
      step,
      error: "処理中にエラーが発生しました",
    }, { status: 500 })
  }
}
