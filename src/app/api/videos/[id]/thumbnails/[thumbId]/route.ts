import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; thumbId: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id, thumbId } = await params

  const { data: thumb, error: thumbErr } = await supabase
    .from("thumbnails")
    .select("*")
    .eq("id", thumbId)
    .eq("video_id", id)
    .single()

  if (thumbErr || !thumb) {
    return NextResponse.json({ error: "サムネイルが見つかりません" }, { status: 404 })
  }

  // Unset all primary for this video
  await supabase.from("thumbnails").update({ is_primary: false }).eq("video_id", id)

  // Set this one as primary
  await supabase.from("thumbnails").update({ is_primary: true }).eq("id", thumbId)

  // Update video thumbnail path
  await supabase.from("videos").update({
    thumbnail_path: thumb.file_path,
    updated_at: new Date().toISOString(),
  }).eq("id", id)

  return NextResponse.json({ status: "ok", primaryId: thumbId })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; thumbId: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id, thumbId } = await params

  const { data: thumb, error: thumbErr } = await supabase
    .from("thumbnails")
    .select("*")
    .eq("id", thumbId)
    .eq("video_id", id)
    .single()

  if (thumbErr || !thumb) {
    return NextResponse.json({ error: "サムネイルが見つかりません" }, { status: 404 })
  }

  if (thumb.is_primary) {
    return NextResponse.json({ error: "プライマリサムネイルは削除できません" }, { status: 400 })
  }

  await supabase.from("thumbnails").delete().eq("id", thumbId)
  return NextResponse.json({ status: "deleted" })
}
