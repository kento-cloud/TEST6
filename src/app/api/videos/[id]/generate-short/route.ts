import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { generateShortVideo } from "@/lib/ai/short-video"
import { getConfigValue } from "@/lib/config"

export const maxDuration = 600 // 10分

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params

  // 動画とAIコンテンツを取得
  const { data: video } = await supabase
    .from("videos")
    .select("id, title, processing_step")
    .eq("id", id)
    .single()

  if (!video) {
    return NextResponse.json({ error: "動画が見つかりません" }, { status: 404 })
  }

  if (video.processing_step !== "none" && video.processing_step !== "error") {
    return NextResponse.json({ error: "他の処理が実行中です" }, { status: 409 })
  }

  const { data: aiContent } = await supabase
    .from("ai_contents")
    .select("article")
    .eq("video_id", id)
    .single()

  if (!aiContent?.article) {
    return NextResponse.json({ error: "記事が生成されていません。先にAI生成を実行してください。" }, { status: 400 })
  }

  const apiKey = await getConfigValue("OPENAI_API_KEY")
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEYが設定されていません" }, { status: 500 })
  }

  // 処理開始
  await supabase.from("videos").update({
    processing_step: "generating_short",
    updated_at: new Date().toISOString(),
  }).eq("id", id)

  try {
    const result = await generateShortVideo(id, aiContent.article, video.title, apiKey)

    // DB更新
    await supabase.from("videos").update({
      short_video_path: result.videoPath,
      processing_step: "none",
      updated_at: new Date().toISOString(),
    }).eq("id", id)

    return NextResponse.json({
      success: true,
      videoPath: result.videoPath,
      slides: result.slides.length,
      durationSeconds: Math.round(result.durationSeconds),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`[generate-short] Error for ${id}:`, message)

    await supabase.from("videos").update({
      processing_step: "error",
      updated_at: new Date().toISOString(),
    }).eq("id", id)

    return NextResponse.json({ error: `ショート動画生成に失敗: ${message}` }, { status: 500 })
  }
}
