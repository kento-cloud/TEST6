import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

// PUT: プリセット更新
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as {
      name?: string
      description?: string
      promptTemplate?: string
    }

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.promptTemplate !== undefined)
      updates.prompt_template = body.promptTemplate

    const { error } = await supabase
      .from("ai_style_presets")
      .update(updates)
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ status: "ok" })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "プリセット更新に失敗しました" },
      { status: 500 }
    )
  }
}

// DELETE: プリセット削除
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const { error } = await supabase
      .from("ai_style_presets")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ status: "deleted" })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "プリセット削除に失敗しました" },
      { status: 500 }
    )
  }
}
