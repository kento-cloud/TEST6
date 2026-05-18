import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { requireAdmin, isAdmin } from "@/lib/auth"
import { snakeToCamelArray } from "@/lib/case-convert"

const PUBLIC_COLUMNS = "id, title, description, thumbnail_path, duration, published_at, category_code"

export async function GET() {
  const admin = await isAdmin()

  if (admin) {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(snakeToCamelArray(data ?? []))
  }

  // Public: only published videos with limited columns
  const { data, error } = await supabase
    .from("videos")
    .select(PUBLIC_COLUMNS)
    .eq("publish_status", "published")
    .order("published_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(snakeToCamelArray(data ?? []))
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string
    const description = formData.get("description") as string ?? ""
    const categoryCode = formData.get("categoryCode") as string ?? ""
    const programId = formData.get("programId") as string

    if (!file || !title) {
      return NextResponse.json({ error: "ファイルとタイトルは必須です" }, { status: 400 })
    }

    const MAX_SIZE = 500 * 1024 * 1024 // 500MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ファイルサイズが500MBを超えています" }, { status: 413 })
    }

    const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "対応していないファイル形式です（MP4, WebM, MOV）" }, { status: 400 })
    }

    const id = ulid()
    const ext = (file.name.split(".").pop() ?? "").toLowerCase()
    const allowedExtensions = ["mp4", "webm", "mov", "avi", "mkv"]
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: `対応していない拡張子です。許可: ${allowedExtensions.join(", ")}` }, { status: 400 })
    }
    const fileName = `${id}.${ext}`
    const uploadDir = path.join(process.cwd(), "uploads", "videos")

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, Buffer.from(bytes))

    const now = new Date().toISOString()

    const aiPrompt = formData.get("aiPrompt") as string ?? ""

    const { error } = await supabase.from("videos").insert({
      id,
      title,
      description,
      file_path: `/api/uploads/videos/${fileName}`,
      file_size: file.size,
      publish_status: "draft",
      processing_step: "none",
      category_code: categoryCode || null,
      program_id: programId ? Number(programId) : null,
      ai_prompt: aiPrompt || null,
      created_at: now,
      updated_at: now,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id, status: "uploaded" }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
