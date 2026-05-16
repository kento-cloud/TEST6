import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const { data: video, error: videoErr } = await supabase
    .from("videos")
    .select("id")
    .eq("id", id)
    .single()

  if (videoErr || !video) {
    return NextResponse.json({ error: "動画が見つかりません" }, { status: 404 })
  }

  // Delete error records
  await supabase.from("transcriptions").delete().eq("video_id", id)
  await supabase.from("ai_contents").delete().eq("video_id", id)

  // Reset video status
  await supabase.from("videos").update({
    publish_status: "draft",
    processing_step: "none",
    updated_at: new Date().toISOString(),
  }).eq("id", id)

  return NextResponse.json({ publishStatus: "draft", message: "リセットしました" })
}
