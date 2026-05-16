import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
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
    return NextResponse.json({
      status: "error",
      step,
      error: isConfigError ? message : "処理中にエラーが発生しました",
    }, { status: 500 })
  }
}
