import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { ulid } from "ulid"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { requireAdmin } from "@/lib/auth"
import { snakeToCamelArray } from "@/lib/case-convert"

export async function GET() {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false })

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

    const id = ulid()
    const ext = file.name.split(".").pop() ?? "mp4"
    const fileName = `${id}.${ext}`
    const uploadDir = path.join(process.cwd(), "uploads", "videos")

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, Buffer.from(bytes))

    const now = new Date().toISOString()

    const { error } = await supabase.from("videos").insert({
      id,
      title,
      description,
      file_path: `/uploads/videos/${fileName}`,
      file_size: file.size,
      publish_status: "draft",
      processing_step: "none",
      category_code: categoryCode || null,
      program_id: programId ? Number(programId) : null,
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
