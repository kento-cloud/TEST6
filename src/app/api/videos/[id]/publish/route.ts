import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function POST(
  req: NextRequest,
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

  let body: { action?: string } = {}
  try {
    body = await req.json()
  } catch {
    // No body or invalid JSON — default to publish
  }

  const now = new Date().toISOString()

  if (body.action === "unpublish") {
    await supabase.from("videos").update({
      publish_status: "review",
      published_at: null,
      updated_at: now,
    }).eq("id", id)

    return NextResponse.json({ status: "review" })
  }

  // Publish check: required fields
  if (!video.title) {
    return NextResponse.json({ error: "タイトルが設定されていません" }, { status: 400 })
  }

  if (video.processing_step === "error") {
    return NextResponse.json({ error: "処理エラーが発生しています。リセットしてください" }, { status: 400 })
  }

  const { data: transcript } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("video_id", id)
    .single()

  if (!transcript || transcript.status !== "done") {
    return NextResponse.json({ error: "文字起こしが完了していません" }, { status: 400 })
  }

  if (!video.thumbnail_path) {
    return NextResponse.json({ error: "サムネイルが設定されていません" }, { status: 400 })
  }

  // Warn if missing optional content (not blocking)
  const warnings: string[] = []
  const { data: aiContent } = await supabase
    .from("ai_contents")
    .select("*")
    .eq("video_id", id)
    .single()

  if (!aiContent || !aiContent.summary) {
    warnings.push("要約が生成されていません")
  }
  if (!aiContent || !aiContent.article) {
    warnings.push("記事が生成されていません")
  }

  await supabase.from("videos").update({
    publish_status: "published",
    published_at: now,
    updated_at: now,
  }).eq("id", id)

  // Create metrics record if not exists
  const { data: existing } = await supabase
    .from("metrics")
    .select("video_id")
    .eq("video_id", id)
    .single()

  if (!existing) {
    await supabase.from("metrics").insert({ video_id: id })
  }

  return NextResponse.json({
    status: "published",
    publishedAt: now,
    ...(warnings.length > 0 ? { warnings } : {}),
  })
}
