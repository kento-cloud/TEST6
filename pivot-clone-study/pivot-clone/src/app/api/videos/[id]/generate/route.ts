import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
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
    // 動画に保存されたai_promptをデフォルト指示として全項目に適用
    const videoPrompt = video.ai_prompt as string | null
    const mergedInstructions = body.instructions ?? {}
    if (videoPrompt && !body.instructions) {
      for (const step of ["summary", "chapters", "article", "tags"] as const) {
        mergedInstructions[step] = mergedInstructions[step] || videoPrompt
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
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
