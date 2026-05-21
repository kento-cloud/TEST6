import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
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

  const { data: aiContent } = await supabase
    .from("ai_contents")
    .select("*")
    .eq("video_id", id)
    .single()

  const checklist = [
    { label: "タイトル設定済み", done: !!video.title },
    { label: "文字起こし完了", done: !!transcript && transcript.status === "done" },
    { label: "サムネイル設定済み", done: !!video.thumbnail_path },
    { label: "AI生成完了", done: !!aiContent && aiContent.status === "done" },
    { label: "記事確認済み", done: !!aiContent?.article },
  ]

  return NextResponse.json({
    video: {
      id: video.id,
      title: video.title,
      publishStatus: video.publish_status,
      processingStep: video.processing_step,
      publishedAt: video.published_at,
      description: video.description,
    },
    checklist,
    summary: aiContent?.summary ?? null,
  })
}
