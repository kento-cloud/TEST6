import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { requireAdmin } from "@/lib/auth"
import { generateShortVideo } from "@/lib/ai/short-video"
import { getConfigValue } from "@/lib/config"

export const maxDuration = 600

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await req.json()
  const { title, article } = body as { title?: string; article?: string }

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 })
  }
  if (!article || !article.trim()) {
    return NextResponse.json({ error: "記事テキストは必須です" }, { status: 400 })
  }

  const apiKey = await getConfigValue("OPENAI_API_KEY")
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEYが設定されていません" }, { status: 500 })
  }

  const videoId = ulid()
  const now = new Date().toISOString()

  // Create video record
  const { error: videoError } = await supabase.from("videos").insert({
    id: videoId,
    title: title.trim(),
    source_type: "article",
    publish_status: "draft",
    processing_step: "generating_short",
    created_at: now,
    updated_at: now,
  })

  if (videoError) {
    return NextResponse.json({ error: `動画レコードの作成に失敗: ${videoError.message}` }, { status: 500 })
  }

  // Create ai_contents record
  const { error: aiError } = await supabase.from("ai_contents").insert({
    id: ulid(),
    video_id: videoId,
    article: article.trim(),
    created_at: now,
    updated_at: now,
  })

  if (aiError) {
    return NextResponse.json({ error: `AIコンテンツの作成に失敗: ${aiError.message}` }, { status: 500 })
  }

  try {
    const result = await generateShortVideo(videoId, article.trim(), title.trim(), apiKey)

    await supabase.from("videos").update({
      short_video_path: result.videoPath,
      processing_step: "none",
      updated_at: new Date().toISOString(),
    }).eq("id", videoId)

    return NextResponse.json({
      success: true,
      videoId,
      shortVideoPath: result.videoPath,
      slides: result.slides.length,
      durationSeconds: Math.round(result.durationSeconds),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    await supabase.from("videos").update({
      processing_step: "error",
      updated_at: new Date().toISOString(),
    }).eq("id", videoId)

    return NextResponse.json({ error: `ショート動画生成に失敗: ${message}` }, { status: 500 })
  }
}
