import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { ulid } from "ulid"

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = (await req.json()) as {
    title?: string
    content?: string
    categoryCode?: string
    publish?: boolean
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 })
  }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "本文は必須です" }, { status: 400 })
  }

  const videoId = ulid()
  const now = new Date().toISOString()
  const publishStatus = body.publish ? "published" : "draft"

  const { error: videoErr } = await supabase.from("videos").insert({
    id: videoId,
    title: body.title.trim(),
    description: body.content.trim().slice(0, 100),
    source_type: "article",
    category_code: body.categoryCode || null,
    publish_status: publishStatus,
    processing_step: "none",
    published_at: body.publish ? now : null,
    created_at: now,
    updated_at: now,
  })

  if (videoErr) {
    return NextResponse.json(
      { error: "記事の作成に失敗しました" },
      { status: 500 }
    )
  }

  await supabase.from("ai_contents").insert({
    id: ulid(),
    video_id: videoId,
    article: body.content.trim(),
    status: "done",
    version: 1,
    created_at: now,
    updated_at: now,
  })

  return NextResponse.json({ id: videoId }, { status: 201 })
}
