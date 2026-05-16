import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { existsSync, unlinkSync } from "fs"
import path from "path"
import { requireAdmin } from "@/lib/auth"
import { snakeToCamel } from "@/lib/case-convert"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "動画が見つかりません" }, { status: 404 })
  }

  return NextResponse.json(snakeToCamel(data))
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const body = await req.json().catch(() => ({})) as {
    title?: string
    description?: string
    categoryCode?: string
    aiPrompt?: string
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.categoryCode !== undefined) updates.category_code = body.categoryCode
  if (body.aiPrompt !== undefined) updates.ai_prompt = body.aiPrompt || null

  const { error } = await supabase
    .from("videos")
    .update(updates)
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}

export async function DELETE(
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

  const deletedFiles: string[] = []
  const failedFiles: string[] = []

  try {
    // Delete thumbnail files from disk
    const { data: videoThumbnails } = await supabase
      .from("thumbnails")
      .select("*")
      .eq("video_id", id)

    for (const thumb of videoThumbnails ?? []) {
      if (thumb.file_path) {
        const thumbFilePath = path.join(process.cwd(), thumb.file_path)
        if (existsSync(thumbFilePath)) {
          try {
            unlinkSync(thumbFilePath)
            deletedFiles.push(thumb.file_path)
          } catch {
            failedFiles.push(thumb.file_path)
          }
        }
      }
    }

    // Delete related DB records
    await supabase.from("transcriptions").delete().eq("video_id", id)
    await supabase.from("ai_contents").delete().eq("video_id", id)
    await supabase.from("thumbnails").delete().eq("video_id", id)
    await supabase.from("metrics").delete().eq("video_id", id)
    await supabase.from("ai_generation_logs").delete().eq("video_id", id)
    await supabase.from("videos").delete().eq("id", id)

    // Delete video file
    if (video.file_path) {
      const filePath = path.join(process.cwd(), video.file_path)
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath)
          deletedFiles.push(video.file_path)
        } catch {
          failedFiles.push(video.file_path)
        }
      }
    }

    return NextResponse.json({
      status: "deleted",
      id,
      deletedFiles,
      ...(failedFiles.length > 0 ? { failedFiles } : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({
      error: `削除中にエラーが発生しました: ${message}`,
      partialResult: { deletedFiles, failedFiles },
    }, { status: 500 })
  }
}
