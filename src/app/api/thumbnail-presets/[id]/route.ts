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
  const body = await req.json() as {
    name?: string
    promptTemplate?: string
    styleParams?: string
    isDefault?: boolean
  }

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.promptTemplate !== undefined) updateData.prompt_template = body.promptTemplate
  if (body.styleParams !== undefined) updateData.style_params = body.styleParams || null

  if (body.isDefault) {
    // Clear other defaults first
    await supabase.from("thumbnail_style_presets").update({ is_default: 0 }).neq("id", id)
    updateData.is_default = 1
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "更新内容がありません" }, { status: 400 })
  }

  const { error } = await supabase.from("thumbnail_style_presets").update(updateData).eq("id", id)
  if (error) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const { error } = await supabase.from("thumbnail_style_presets").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
