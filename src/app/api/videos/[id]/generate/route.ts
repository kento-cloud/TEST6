import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { requireAdmin } from "@/lib/auth"
import { generateAll } from "@/lib/ai/pipeline"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const body = await req.json().catch(() => ({})) as {
    instructions?: Partial<Record<string, string>>
    promptMode?: "append" | "override"
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
    // 番組のAI設定を取得
    let programPrompt: string | null = null
    if (video.program_id) {
      const { data: program } = await supabase
        .from("programs")
        .select("ai_prompt, ai_style_preset_id")
        .eq("id", video.program_id)
        .single()
      if (program?.ai_prompt) {
        programPrompt = program.ai_prompt
      }
      // 番組のプリセットも考慮（動画に個別指示がない場合）
      if (!video.ai_prompt && program?.ai_style_preset_id) {
        const { data: preset } = await supabase
          .from("ai_style_presets")
          .select("prompt_template")
          .eq("id", program.ai_style_preset_id)
          .single()
        if (preset) {
          programPrompt = preset.prompt_template
        }
      }
    }

    // 優先順位: 動画個別 > 番組 > ベースプロンプト
    const effectivePrompt = (video.ai_prompt as string | null) || programPrompt
    const mergedInstructions = body.instructions ?? {}
    if (effectivePrompt && !body.instructions) {
      for (const step of ["summary", "chapters", "article", "tags"] as const) {
        mergedInstructions[step] = mergedInstructions[step] || effectivePrompt
      }
    }

    const result = await generateAll(id, transcript.full_text, video.title, {
      instructions: Object.keys(mergedInstructions).length > 0 ? mergedInstructions : undefined,
      promptMode: body.promptMode,
    })

    return NextResponse.json({
      status: "done",
      summaryLength: result.summary.length,
      articleLength: result.article.length,
      tagCount: result.tags.length,
      processingMs: result.processingMs,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`[generate] Error for video ${id}:`, message)
    const isConfigError = message.includes("設定されていません")

    if (isConfigError) {
      // モックフォールバック: API未設定時にモックデータを挿入
      const now = new Date().toISOString()
      const mockSummary = "[モック] AI APIが未接続のため、モックデータです。接続後に再生成してください。"
      const mockChapters = JSON.stringify([
        { title: "イントロダクション", startTime: 0, endTime: 120, summary: "動画の導入部分です。" },
        { title: "メインコンテンツ", startTime: 120, endTime: 360, summary: "主要なトピックについて解説します。" },
        { title: "まとめ", startTime: 360, endTime: 480, summary: "内容の振り返りと結論です。" },
      ])
      const mockArticle = "## モック記事\n\nAI API接続後に本番の記事が生成されます。\n\n### 概要\n\nこの記事はモックデータです。"
      const mockTags = JSON.stringify(["モック", "テスト", "AI未接続"])

      const { data: existing } = await supabase
        .from("ai_contents")
        .select("id")
        .eq("video_id", id)
        .single()

      if (existing) {
        await supabase.from("ai_contents").update({
          summary: mockSummary,
          chapters: mockChapters,
          article: mockArticle,
          tags: mockTags,
          status: "done",
          updated_at: now,
        }).eq("video_id", id)
      } else {
        await supabase.from("ai_contents").insert({
          id: ulid(),
          video_id: id,
          summary: mockSummary,
          chapters: mockChapters,
          article: mockArticle,
          tags: mockTags,
          status: "done",
          created_at: now,
          updated_at: now,
        })
      }

      await supabase.from("videos").update({
        publish_status: "review",
        processing_step: "none",
        updated_at: now,
      }).eq("id", id)

      return NextResponse.json({
        status: "done",
        mock: true,
        summaryLength: mockSummary.length,
        articleLength: mockArticle.length,
        tagCount: 3,
      })
    }

    return NextResponse.json({
      error: "処理中にエラーが発生しました",
    }, { status: 500 })
  }
}
