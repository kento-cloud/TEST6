import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { generateAll } from "@/lib/ai/pipeline"
import { insertMockAIContents } from "@/lib/ai/mock-fallback"

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
    const isConfigError = message.includes("設定されていません")

    if (isConfigError) {
      const mock = await insertMockAIContents(id)

      return NextResponse.json({
        status: "done",
        mock: true,
        summaryLength: mock.summary.length,
        articleLength: mock.article.length,
        tagCount: 3,
      })
    }

    return NextResponse.json({
      error: "処理中にエラーが発生しました",
    }, { status: 500 })
  }
}
