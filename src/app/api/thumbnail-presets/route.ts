import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { ulid } from "ulid"

export const dynamic = "force-dynamic"

export async function GET() {
  const { data, error } = await supabase
    .from("thumbnail_style_presets")
    .select("id, name, prompt_template, style_params, is_default, created_at")
    .order("is_default", { ascending: false })

  if (error) {
    return NextResponse.json([], { status: 200 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await req.json() as {
    name?: string
    promptTemplate?: string
    styleParams?: string
  }

  if (!body.name || !body.promptTemplate) {
    return NextResponse.json({ error: "名前とプロンプトテンプレートは必須です" }, { status: 400 })
  }

  const { error } = await supabase.from("thumbnail_style_presets").insert({
    id: ulid(),
    name: body.name,
    prompt_template: body.promptTemplate,
    style_params: body.styleParams || null,
    is_default: 0,
    created_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ error: "追加に失敗しました" }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
