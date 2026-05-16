import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const body = await req.json().catch(() => ({})) as {
    summary?: string
    chapters?: string
    article?: string
    tags?: string
  }

  const { data: existing } = await supabase
    .from("ai_contents")
    .select("id")
    .eq("video_id", id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: "AI生成コンテンツが見つかりません" }, { status: 404 })
  }

  const updates: Record<string, unknown> = {
    is_edited: 1,
    updated_at: new Date().toISOString(),
  }

  if (body.summary !== undefined) updates.summary = body.summary
  if (body.chapters !== undefined) updates.chapters = body.chapters
  if (body.article !== undefined) updates.article = body.article
  if (body.tags !== undefined) updates.tags = body.tags

  const { error } = await supabase
    .from("ai_contents")
    .update(updates)
    .eq("video_id", id)

  if (error) {
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}
