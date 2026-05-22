import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const authError = await requireAdmin()
  if (authError) return authError

  const { data: video, error: videoErr } = await supabase
    .from("videos")
    .select("id, title, description, category_code, publish_status, created_at, source_type")
    .eq("id", id)
    .single()

  if (videoErr || !video) {
    return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 })
  }

  if (video.source_type !== "article") {
    return NextResponse.json({ error: "この動画は記事ではありません" }, { status: 400 })
  }

  const { data: aiContent } = await supabase
    .from("ai_contents")
    .select("article")
    .eq("video_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    id: video.id,
    title: video.title,
    description: video.description,
    categoryCode: video.category_code,
    publishStatus: video.publish_status,
    createdAt: video.created_at,
    content: aiContent?.article ?? "",
  })
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
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

  const now = new Date().toISOString()
  const publishStatus = body.publish ? "published" : "draft"

  const { error: videoErr } = await supabase
    .from("videos")
    .update({
      title: body.title.trim(),
      description: body.content.trim().slice(0, 100),
      category_code: body.categoryCode || null,
      publish_status: publishStatus,
      published_at: body.publish ? now : null,
      updated_at: now,
    })
    .eq("id", id)

  if (videoErr) {
    return NextResponse.json(
      { error: "記事の更新に失敗しました" },
      { status: 500 }
    )
  }

  // Update or insert ai_contents
  const { data: existing } = await supabase
    .from("ai_contents")
    .select("id")
    .eq("video_id", id)
    .limit(1)
    .single()

  if (existing) {
    await supabase
      .from("ai_contents")
      .update({
        article: body.content.trim(),
        updated_at: now,
      })
      .eq("id", existing.id)
  } else {
    const { ulid } = await import("ulid")
    await supabase.from("ai_contents").insert({
      id: ulid(),
      video_id: id,
      article: body.content.trim(),
      status: "done",
      version: 1,
      created_at: now,
      updated_at: now,
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const authError = await requireAdmin()
  if (authError) return authError

  // Delete ai_contents first
  await supabase.from("ai_contents").delete().eq("video_id", id)

  const { error } = await supabase.from("videos").delete().eq("id", id)

  if (error) {
    return NextResponse.json(
      { error: "記事の削除に失敗しました" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
