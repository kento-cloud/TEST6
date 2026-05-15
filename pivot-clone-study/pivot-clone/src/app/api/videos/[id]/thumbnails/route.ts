import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { requireAdmin } from "@/lib/auth"
import { snakeToCamelArray } from "@/lib/case-convert"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data, error } = await supabase
    .from("thumbnails")
    .select("*")
    .eq("video_id", id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(snakeToCamelArray(data ?? []))
}

export async function POST(
  req: NextRequest,
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

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 })
  }

  const thumbId = ulid()
  const ext = file.name.split(".").pop() ?? "webp"
  const fileName = `${thumbId}.${ext}`
  const uploadDir = path.join(process.cwd(), "uploads", "thumbnails")
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const bytes = await file.arrayBuffer()
  await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes))

  const { data: hasPrimary } = await supabase
    .from("thumbnails")
    .select("id")
    .eq("video_id", id)
    .limit(1)
    .single()

  const isPrimary = !hasPrimary

  await supabase.from("thumbnails").insert({
    id: thumbId,
    video_id: id,
    file_path: `/uploads/thumbnails/${fileName}`,
    source: "manual",
    is_primary: isPrimary,
    status: "done",
    file_size: file.size,
    created_at: new Date().toISOString(),
  })

  // If first thumbnail, set as primary on video
  if (isPrimary) {
    await supabase.from("videos").update({
      thumbnail_path: `/uploads/thumbnails/${fileName}`,
      updated_at: new Date().toISOString(),
    }).eq("id", id)
  }

  return NextResponse.json({ id: thumbId, status: "done" }, { status: 201 })
}
